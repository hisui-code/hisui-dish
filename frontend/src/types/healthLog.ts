/**
 * 健康記録の種別
 */
export type HealthLogType =
  | 'vomit'
  | 'diarrhea'
  | 'bloody_stool'
  | 'injury'
  | 'hospital_visit'
  | 'medication'
  | 'weight'
  | 'other'

/**
 * 健康記録画面で使用するフィルター種別
 */
export type HealthLogFilterType = 'all' | HealthLogType

export type HealthLogPhoto = {
  /** 写真ID */
  id: string
  /** 保存先disk */
  disk: string
  /** storage内の保存キー */
  objectKey: string
  /** 元ファイル名 */
  originalName: string
  /** MIME type */
  mimeType: string
  /** byte数 */
  bytes: number
  /** 公開状態 */
  visibility: string
  /** アップロード状態 */
  status: string
}

/**
 * 一覧や詳細表示で扱う健康記録1件分のデータ
 */
export type HealthLogRecord = {
  /** 健康記録を一意に識別するID */
  id: string
  /** 記録の種別 */
  type: HealthLogType
  /** 発生日時のISO文字列 */
  occurredAt: string
  /** 補足メモ */
  note?: string
  /** 体重記録の値 */
  weightKg?: number
  /** 添付写真のメタデータ一覧 */
  photos: HealthLogPhoto[]
}

/**
 * 健康記録を保存するときにAPIへ渡すデータ
 */
export type HealthLogSavePayload = {
  /** 保存する記録の種別 */
  type: HealthLogType
  /** 保存用に整形済みの発生日時 */
  occurredAt: string
  /** 保存する補足メモ */
  note?: string
  /** 保存する体重の値 */
  weightKg?: number
  /** 保存時に紐付ける写真ID一覧 */
  photos: string[]
}

/**
 * 健康記録フォームで管理する入力値
 */
export type HealthLogFormInput = {
  /** フォームで選択された記録種別 */
  type: HealthLogType
  /** 入力された発生日 */
  occurredDate: string
  /** 入力された発生時刻 */
  occurredTime: string
  /** フォーム上のメモ入力 */
  note: string
  /** フォーム上の体重入力文字列 */
  weightKg: string
  /** フォーム上の写真メタデータ一覧 */
  photos: HealthLogPhoto[]
}
