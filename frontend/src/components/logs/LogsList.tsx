import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'

import { deleteLog } from '@/lib/api/logsApi'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import ConfirmDeleteLogDialog from './ConfirmDeleteLogDialog'

import type { LogGroup } from '@/types/logs'
import type { LogItem } from '@/types/logs'
import LogRow from './LogRow'
import LogsEmptyState from './LogsEmptyState'

type LogsListProps = {
  groups: LogGroup[]
  month: string
}

/**
 * @description 日付グループ化されたログ一覧を表示し、削除確認モーダルを管理する
 * @param groups 日付ごとのロググループ
 * @param month 対象月（YYYY-MM）
 * @returns ログ一覧のJSX
 */
export default function LogsList({ groups, month }: LogsListProps) {
  const [deleteTarget, setDeleteTarget] = useState<LogItem | null>(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
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
  const handleRequestDelete = (item: LogItem) => {
    setDeleteTarget(item)
  }

  // 削除確認モーダルを閉じる
  const handleCancelDelete = () => {
    setDeleteTarget(null)
  }

  // 削除APIを実行してモーダルを閉じる
  const handleConfirmDelete = () => {
    // 対象がない状態では実行しない
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  if (groups.length === 0) return <LogsEmptyState month={month} />
  return (
    <>
      <div className="mt-5 space-y-4">
        {groups.map((g) => (
          <div key={g.dayKey} className="rounded-3xl bg-card shadow-sm ">
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-muted-foreground">{g.dayLabel}</div>
            </div>

            <div className="pt-1 bg-muted/30 p-2">
              <AnimatePresence initial={false}>
                {g.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-1 mb-2">
                      <LogRow item={item} onDelete={handleRequestDelete} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDeleteLogDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        isSubmitting={deleteMutation.isPending}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
