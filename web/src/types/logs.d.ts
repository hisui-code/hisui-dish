// ログ１件分
export type LogItem = {
  id: string
  recordedAtIso: string
  grams: number
}

// 日付ごとのグループ
export type LogGroup = {
  dayKey: string
  dayLabel: string
  items: LogItem[]
}

// 時間帯
export type TimeBand = 'all' | 'morning' | 'daytime' | 'evening' | 'night'
