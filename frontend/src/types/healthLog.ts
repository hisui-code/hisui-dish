/**
 * @description 健康記録の種別
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
 * @description 健康記録画面のフィルター種別
 */
export type HealthLogFilterType = 'all' | HealthLogType

/**
 * @description 健康記録1件分のデータ構造
 */
export type HealthLogRecord = {
  id: string
  type: HealthLogType
  occurredAt: string
  note?: string
  weightKg?: number
  photos: string[]
}

/**
 * @description 健康記録の保存時に扱う入力データ
 */
export type HealthLogSavePayload = {
  type: HealthLogType
  occurredAt: string
  note?: string
  weightKg?: number
  photos: string[]
}
