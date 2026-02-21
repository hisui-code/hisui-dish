import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteLog } from '@/lib/api/logsApi'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import type { LogItem } from '@/types/logs'

export type UseLogsDeleteDialogResult = {
  /** 削除確認中の対象ログ。未選択時はnull */
  deleteTarget: LogItem | null
  /** 削除API送信中フラグ。二重送信防止に使う */
  isSubmitting: boolean
  /** 対象ログを指定して削除確認ダイアログを開く */
  onRequestDelete: (item: LogItem) => void
  /** 削除確認ダイアログを閉じる */
  onCancelDelete: () => void
  /** 選択中ログの削除を実行する */
  onConfirmDelete: () => void
}

/**
 * @description ログ削除ダイアログの状態管理と削除処理を担当する
 * @param month 対象月（YYYY-MM）
 * @returns 削除ダイアログ制御用の状態と操作
 */
export function useLogsDeleteDialog(month: string): UseLogsDeleteDialogResult {
  const [deleteTarget, setDeleteTarget] = useState<LogItem | null>(null)
  const queryClient = useQueryClient()

  // ログ削除APIの実行状態と成功後のキャッシュ更新を管理する
  const deleteMutation = useMutation({
    // mutationには削除対象のlogIdだけを渡してAPIを呼ぶ
    mutationFn: (logId: string) => deleteLog(logId),
    onSuccess: (_, logId) => {
      // 削除成功時はキャッシュから対象を除外する
      queryClient.setQueryData<LogItem[]>(logsQueryKey(month), (current) => {
        // まだキャッシュがない場合はそのまま返す
        if (!current) return current
        return current.filter((item) => item.id !== logId)
      })
    },
  })

  // 削除確認モーダルを開く
  const onRequestDelete = (item: LogItem) => {
    setDeleteTarget(item)
  }

  // 削除確認モーダルを閉じる
  const onCancelDelete = () => {
    setDeleteTarget(null)
  }

  // 削除APIを実行してモーダルを閉じる
  const onConfirmDelete = () => {
    // 対象がない状態では実行しない
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  return {
    deleteTarget,
    isSubmitting: deleteMutation.isPending,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
  }
}
