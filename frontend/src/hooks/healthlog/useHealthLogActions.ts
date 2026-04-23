import { useState } from 'react'
import { createHealthLog, deleteHealthLog, updateHealthLog } from '@/lib/api/healthLogsApi'
import { buildHealthLogSavePayload } from '@/lib/health-log/payload'
import { validateHealthLogForm } from '@/schemas/healthLog'
import type { HealthLogFormInput, HealthLogRecord, HealthLogType } from '@/types/healthLog'

type HealthLogFormModalState = {
  /** 編集中の健康記録 */
  editingLog: HealthLogRecord | null
  /** フォームで選択中の記録種別 */
  selectedRecordType: HealthLogType
  /** フォームに入力された発生日 */
  occurredDate: string
  /** フォームに入力された発生時刻 */
  occurredTime: string
  /** フォームに入力されたメモ */
  note: string
  /** フォームに入力された体重文字列 */
  weightKg: string
  /** フォームに入力された写真識別子一覧 */
  photos: string[]
  /** フォームモーダルを閉じる処理 */
  close: () => void
}

type HealthLogDeleteDialogState = {
  /** 削除確認中の健康記録 */
  deleteTarget: HealthLogRecord | null
  /** 削除確認ダイアログを開く処理 */
  openDeleteDialog: (item: HealthLogRecord) => void
  /** 削除確定後に削除確認状態を閉じる処理 */
  confirmDelete: () => void
}

type UseHealthLogActionsParams = {
  /** 健康記録フォームモーダルの状態と操作 */
  formModal: HealthLogFormModalState
  /** 削除確認ダイアログの状態と操作 */
  deleteDialog: HealthLogDeleteDialogState
}

type UseHealthLogActionsResult = {
  /** フォームに表示するエラーメッセージ */
  formErrorMessage: string | null
  /** フォームを閉じる */
  closeForm: () => void
  /** フォームから削除確認を開く */
  requestDeleteFromForm: () => void
  /** 健康記録を保存する */
  saveHealthLog: () => Promise<void>
  /** 健康記録の削除を確定する */
  confirmDeleteHealthLog: () => Promise<void>
  /** 保存処理中かどうか */
  isSaving: boolean
  /** 削除処理中かどうか */
  isDeleting: boolean
}

/**
 * @description 健康記録画面の保存・削除操作を管理する
 * フォームモーダルと削除確認ダイアログをまたぐ処理をここに集約する
 */
export function useHealthLogActions({
  formModal,
  deleteDialog,
}: UseHealthLogActionsParams): UseHealthLogActionsResult {
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /** フォームを閉じて入力エラーをリセットする */
  const closeForm = () => {
    setFormErrorMessage(null)
    formModal.close()
  }

  /** 編集モーダルの削除ボタンから削除確認ダイアログを開く */
  const requestDeleteFromForm = () => {
    if (!formModal.editingLog) return

    setFormErrorMessage(null)
    deleteDialog.openDeleteDialog(formModal.editingLog)
  }

  /** フォーム入力を検証し、追加または更新の API 入口へ渡す */
  const saveHealthLog = async () => {
    // ２重送信を防止するため保存中はreturnする
    if (isSaving) return

    // モーダルの入力状態を検証用フォーム値にまとめる
    const form: HealthLogFormInput = {
      type: formModal.selectedRecordType,
      occurredDate: formModal.occurredDate,
      occurredTime: formModal.occurredTime,
      note: formModal.note,
      weightKg: formModal.weightKg,
      photos: formModal.photos,
    }

    // 入力不備がある場合は API へ渡さず、フォームにエラーを表示する
    const result = validateHealthLogForm(form)
    if (!result.success) {
      setFormErrorMessage(result.message)
      return
    }

    setFormErrorMessage(null)
    setIsSaving(true)

    try {
      const payload = buildHealthLogSavePayload(result.data)

      if (formModal.editingLog) {
        // 編集中の記録がある場合は更新として扱う
        await updateHealthLog(formModal.editingLog.id, payload)
        formModal.close()
        return
      }
      // 編集対象がない場合は新規作成として扱う
      await createHealthLog(payload)
      formModal.close()
    } finally {
      setIsSaving(false)
    }
  }

  /** 削除対象の記録を削除し、関連モーダルを閉じる */
  const confirmDeleteHealthLog = async () => {
    // ２重送信を防止するため削除中はreturnする
    if (isDeleting) return
    // 削除対象が存在しなければreturnする
    if (!deleteDialog.deleteTarget) return

    setIsDeleting(true)

    try {
      await deleteHealthLog(deleteDialog.deleteTarget.id)
      deleteDialog.confirmDelete()
      formModal.close()
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    formErrorMessage,
    closeForm,
    requestDeleteFromForm,
    saveHealthLog,
    confirmDeleteHealthLog,
    isSaving,
    isDeleting,
  }
}
