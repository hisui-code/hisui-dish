import { useHealthLogActions } from '@/hooks/healthlog/useHealthLogActions'
import useHealthLogDeleteDialog from '@/hooks/healthlog/useHealthLogDeleteDialog'
import { useHealthLogFormModal } from '@/hooks/healthlog/useHealthLogFormModal'
import { useHealthLogPage } from '@/hooks/healthlog/useHealthLogPage'
import useHealthLogPhotoModal from '@/hooks/healthlog/useHealthLogPhotoModal'
import { useHealthLogPhotoUpload } from '@/hooks/healthlog/useHealthLogPhotoUpload'
import type { HealthLogFilterType, HealthLogPhoto, HealthLogRecord } from '@/types/healthLog'
import type { HealthLogFormModalViewModel } from '@/types/healthLogPage'

type HealthLogSummaryCardsViewModel = {
  /** 今月の記録回数 */
  monthlyLogCount: number
  /** 最終通院日の日付表示 */
  latestHospitalVisitDate: string
  /** 最新体重の表示値 */
  latestWeightValue: string
  /** 最新体重の計測日表示 */
  latestWeightDate: string
}

type HealthLogFiltersViewModel = {
  /** 現在選択中の種別 */
  selectedType: HealthLogFilterType
  /** 現在選択中の年月 */
  selectedMonth: string
  /** 種別変更時の処理 */
  onChangeType: (value: HealthLogFilterType) => void
  /** 年月変更時の処理 */
  onChangeMonth: (value: string) => void
}

type HealthLogTimelineViewModel = {
  /** フィルター適用後の健康記録一覧 */
  logs: HealthLogRecord[]
  /** 編集モーダルを開く処理 */
  onEdit: (log: HealthLogRecord) => void
  /** 写真モーダルを開く処理 */
  onOpenPhoto: (photo: HealthLogPhoto) => void
}

type HealthLogDeleteDialogViewModel = {
  /** 削除確認ダイアログの表示状態 */
  open: boolean
  /** 削除対象の健康記録 */
  target: HealthLogRecord | null
  /** 削除処理中かどうか */
  isDeleting: boolean
  /** 削除失敗時に表示するエラーメッセージ */
  errorMessage: string | null
  /** キャンセル時の処理 */
  onCancel: () => void
  /** 削除確定時の処理 */
  onConfirm: () => Promise<void>
}

type HealthLogPhotoModalViewModel = {
  /** 写真モーダルの表示状態 */
  open: boolean
  /** 表示中の写真 */
  photo: HealthLogPhoto | null
  /** モーダルを閉じる処理 */
  onClose: () => void
}

type UseHealthLogPageViewModelResult = {
  /** 記録追加モーダルを開く処理 */
  onOpenCreate: () => void
  /** サマリーカード表示用の値 */
  summaryCards: HealthLogSummaryCardsViewModel
  /** フィルター表示用の値と操作 */
  filters: HealthLogFiltersViewModel
  /** 一覧取得中かどうか */
  isLoading: boolean
  /** 一覧取得エラーメッセージ */
  errorMessage: string | null
  /** タイムライン表示用の値と操作 */
  timeline: HealthLogTimelineViewModel
  /** 追加・編集モーダル表示用の値と操作 */
  formModal: HealthLogFormModalViewModel
  /** 削除確認ダイアログ表示用の値と操作 */
  deleteDialog: HealthLogDeleteDialogViewModel
  /** 写真モーダル表示用の値と操作 */
  photoModal: HealthLogPhotoModalViewModel
}

/**
 * @description 健康記録ページで使う状態と操作を画面表示用にまとめる
 */
export function useHealthLogPageViewModel(): UseHealthLogPageViewModelResult {
  const healthLogPage = useHealthLogPage()
  const formModal = useHealthLogFormModal()
  const deleteDialog = useHealthLogDeleteDialog()
  const photoModal = useHealthLogPhotoModal()

  const photoUpload = useHealthLogPhotoUpload({
    photos: formModal.photos,
    onChangePhotos: formModal.setPhotos,
  })

  const healthLogActions = useHealthLogActions({
    formModal,
    deleteDialog,
    photoChanges: {
      deletePendingPhoto: photoUpload.deletePendingPhoto,
      resetPhotoChanges: photoUpload.resetPhotoChanges,
    },
    selectedMonth: healthLogPage.selectedMonth,
  })

  return {
    // ヘッダーの追加ボタンから新規作成モーダルを開く
    onOpenCreate: formModal.openForCreate,

    // サマリーカードに表示する値をまとめる
    summaryCards: {
      monthlyLogCount: healthLogPage.monthlyLogCount,
      latestHospitalVisitDate: healthLogPage.latestHospitalVisitDate,
      latestWeightValue: healthLogPage.latestWeightValue,
      latestWeightDate: healthLogPage.latestWeightDate,
    },

    // フィルターUIに渡す選択状態と変更処理をまとめる
    filters: {
      selectedType: healthLogPage.selectedType,
      selectedMonth: healthLogPage.selectedMonth,
      onChangeType: healthLogPage.setSelectedType,
      onChangeMonth: healthLogPage.setSelectedMonth,
    },

    // 一覧取得状態はページ側の表示分岐に使う
    isLoading: healthLogPage.isLoading,
    errorMessage: healthLogPage.errorMessage,

    // タイムラインに渡す一覧と操作をまとめる
    timeline: {
      logs: healthLogPage.filteredLogs,
      onEdit: formModal.openForEdit,
      onOpenPhoto: photoModal.openPhotoModal,
    },

    // 入力モーダルの値・状態・操作を責務別にまとめる
    formModal: {
      form: {
        selectedRecordType: formModal.selectedRecordType,
        occurredDate: formModal.occurredDate,
        occurredTime: formModal.occurredTime,
        note: formModal.note,
        weightKg: formModal.weightKg,
        photos: formModal.photos,
      },
      state: {
        open: formModal.isOpen,
        mode: formModal.editingLog ? 'edit' : 'create',
        errorMessage: healthLogActions.formErrorMessage,
        isSaving: healthLogActions.isSaving,
        isUploadingPhoto: photoUpload.isUploadingPhoto,
        isDeletingPhoto: photoUpload.isDeletingPhoto,
        photoErrorMessage: photoUpload.photoErrorMessage,
      },
      actions: {
        onSave: healthLogActions.saveHealthLog,
        onUploadPhoto: photoUpload.uploadPhoto,
        onRemovePhoto: photoUpload.removePhoto,
        onDelete: healthLogActions.requestDeleteFromForm,
        onClose: healthLogActions.closeForm,
        onChangeRecordType: formModal.setSelectedRecordType,
        onChangeOccurredDate: formModal.setOccurredDate,
        onChangeOccurredTime: formModal.setOccurredTime,
        onChangeNote: formModal.setNote,
        onChangeWeightKg: formModal.setWeightKg,
      },
    },

    // 削除確認ダイアログに必要な状態と削除操作をまとめる
    deleteDialog: {
      open: deleteDialog.deleteTarget !== null,
      target: deleteDialog.deleteTarget,
      isDeleting: healthLogActions.isDeleting,
      errorMessage: healthLogActions.deleteErrorMessage,
      onCancel: healthLogActions.cancelDeleteHealthLog,
      onConfirm: healthLogActions.confirmDeleteHealthLog,
    },

    // 写真拡大モーダルに必要な状態と閉じる操作をまとめる
    photoModal: {
      open: photoModal.selectedPhoto !== null,
      photo: photoModal.selectedPhoto,
      onClose: photoModal.closePhotoModal,
    },
  }
}
