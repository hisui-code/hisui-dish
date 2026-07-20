import type { HealthLogPhoto, HealthLogType } from '@/types/healthLog'

export type HealthLogFormModalViewModel = {
  /** フォーム入力値 */
  form: {
    /** 現在選択中の記録種別 */
    selectedRecordType: HealthLogType
    /** 発生日の入力値 */
    occurredDate: string
    /** 発生時刻の入力値 */
    occurredTime: string
    /** メモ入力欄の値 */
    note: string
    /** 体重入力欄の値 */
    weightKg: string
    /** 写真メタデータ一覧 */
    photos: HealthLogPhoto[]
  }

  /** モーダルの表示状態 */
  state: {
    /** モーダルの表示状態 */
    open: boolean
    /** フォームの追加・編集モード */
    mode: 'create' | 'edit'
    /** エラー表示用メッセージ */
    errorMessage: string | null
    /** 保存処理中かどうか */
    isSaving: boolean
    /** 写真アップロード中かどうか */
    isUploadingPhoto: boolean
    /** 写真削除中かどうか */
    isDeletingPhoto: boolean
    /** 写真操作エラー */
    photoErrorMessage: string | null
  }

  /** フォーム操作 */
  actions: {
    /** 保存処理 */
    onSave: () => Promise<void>
    /** 写真アップロード処理 */
    onUploadPhoto: (file: File) => Promise<void>
    /** 写真削除処理 */
    onRemovePhoto: (photoId: string) => Promise<void>
    /** 健康記録削除処理 */
    onDelete: () => void
    /** モーダルを閉じる処理 */
    onClose: () => void
    /** 記録種別を変更する処理 */
    onChangeRecordType: (type: HealthLogType) => void
    /** 発生日を更新する処理 */
    onChangeOccurredDate: (value: string) => void
    /** 発生時刻を更新する処理 */
    onChangeOccurredTime: (value: string) => void
    /** メモ入力値を更新する処理 */
    onChangeNote: (value: string) => void
    /** 体重入力値を更新する処理 */
    onChangeWeightKg: (value: string) => void
  }
}
