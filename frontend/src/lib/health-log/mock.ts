/**
 * @description 健康記録画面のレイアウト確認に使うモックデータ
 * API 接続前の表示確認用として扱う
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
 * @description 健康記録1件分のモックデータ
 */
export type HealthLogMock = {
  id: string
  type: HealthLogType
  occurredAt: string
  note?: string
  weightKg?: number
  photos: string[]
}

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
 * @description 健康記録画面の見た目確認に使う仮データ一覧
 */
export const mockHealthLogs: HealthLogMock[] = [
  {
    id: 'health-log-001',
    type: 'vomit',
    occurredAt: '2026-03-24T08:15:00',
    note: '朝食後に毛玉を少量嘔吐。食欲と元気は普段通り',
    photos: ['sample-photo-1'],
  },
  {
    id: 'health-log-002',
    type: 'hospital_visit',
    occurredAt: '2026-03-20T15:30:00',
    note: '整腸剤を継続。1週間ほど便の状態を観察するよう案内あり',
    photos: [],
  },
  {
    id: 'health-log-003',
    type: 'weight',
    occurredAt: '2026-03-18T09:00:00',
    note: '朝の計測',
    weightKg: 3.82,
    photos: [],
  },
  {
    id: 'health-log-004',
    type: 'diarrhea',
    occurredAt: '2026-03-14T22:10:00',
    note: '夜のトイレで軟便。食欲はあり',
    photos: [],
  },
  {
    id: 'health-log-005',
    type: 'medication',
    occurredAt: '2026-03-09T21:00:00',
    note: '処方された整腸剤を投与',
    photos: [],
  },
  {
    id: 'health-log-006',
    type: 'weight',
    occurredAt: '2026-03-08T08:45:00',
    weightKg: 3.2,
    photos: [],
  },
  {
    id: 'health-log-007',
    type: 'bloody_stool',
    occurredAt: '2026-02-26T07:40:00',
    note: '少量の血が混じっていたため、通院を判断',
    photos: ['sample-photo-2'],
  },
]
