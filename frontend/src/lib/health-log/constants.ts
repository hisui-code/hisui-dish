import type { HealthLogFilterType, HealthLogType } from '@/types/healthLog'

/**
 * @description 健康記録の種別一覧
 */
export const healthLogTypes: HealthLogType[] = [
  'vomit',
  'diarrhea',
  'bloody_stool',
  'injury',
  'hospital_visit',
  'medication',
  'weight',
  'other',
]

/**
 * @description 健康記録種別の表示名
 */
export const healthLogTypeLabels: Record<HealthLogType, string> = {
  vomit: '嘔吐',
  diarrhea: '下痢',
  bloody_stool: '血便',
  injury: 'ケガ',
  hospital_visit: '通院',
  medication: '投薬',
  weight: '体重',
  other: 'その他',
}

/**
 * @description 健康記録画面のフィルター選択肢
 */
export const healthLogFilterOptions: { value: HealthLogFilterType; label: string }[] = [
  { value: 'all', label: 'すべて' },
  ...healthLogTypes.map((type) => ({
    value: type,
    label: healthLogTypeLabels[type],
  })),
]
