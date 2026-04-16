import { useState } from 'react'
import type { HealthLogRecord } from '@/types/healthLog'

type UseHealthLogDeleteDialogResult = {
  /** 削除確認中の対象レコード */
  deleteTarget: HealthLogRecord | null
  /** 削除確認ダイアログを開く */
  openDeleteDialog: (item: HealthLogRecord) => void
  /** 削除確認ダイアログを閉じる */
  closeDeleteDialog: () => void
  /** 削除確定時の処理 */
  confirmDelete: () => void
}

/**
 * @description 健康記録の削除確認ダイアログ状態を管理する
 */
export default function useHealthLogDeleteDialog(): UseHealthLogDeleteDialogResult {
  const [deleteTarget, setDeleteTarget] = useState<HealthLogRecord | null>(null)

  const openDeleteDialog = (item: HealthLogRecord) => {
    setDeleteTarget(item)
  }

  const closeDeleteDialog = () => {
    setDeleteTarget(null)
  }

  const confirmDelete = () => {
    setDeleteTarget(null)
  }

  return {
    deleteTarget,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  }
}
