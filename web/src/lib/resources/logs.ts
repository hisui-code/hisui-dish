import dayjs from 'dayjs'
import 'dayjs/locale/ja'

import type { LogItem, LogGroup, TimeBand } from '@/types/logs'

dayjs.locale('ja')

// 時間帯ラベル
export const timeBandLabels: Record<TimeBand, string> = {
  all: 'すべて',
  morning: '朝',
  daytime: '昼',
  evening: '夕方',
  night: '夜・深夜',
}

// ISO文字列をHH:mmに変換
export function formatTime(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

// 初期表示の月(YYYY-MM)
export function getDefaultMonth(): string {
  return dayjs().format('YYYY-MM')
}

// 日付表示 MM月DD(曜日) 形式
export function formatDayLabel(iso: string): string {
  return dayjs(iso).format('M/D(dd)')
}

export function getTimeBand(iso: string): TimeBand {
  const h = dayjs(iso).hour()

  if (h >= 5 && h < 11) return 'morning' // 5:00〜10:59 朝
  if (h >= 11 && h < 16) return 'daytime' // 11:00〜15:59 昼
  if (h >= 16 && h < 22) return 'evening' // 16:00〜21:59 夕方〜夜
  return 'night' // 22:00〜4:59 夜・深夜
}

// フィルター

export function filterLogs(
  logs: LogItem[],
  month: string,
  query: string,
  timeBand: TimeBand
): LogItem[] {
  const q = query.trim()

  // 1. 月フィルタ（YYYY-MM 部分で一致）
  const monthFiltered = logs.filter((x) => x.recordedAtIso.slice(0, 7) === month)

  // 2. 時間帯フィルタ（朝/昼/夕方/夜）
  const bandFiltered =
    timeBand === 'all'
      ? monthFiltered
      : monthFiltered.filter((x) => getTimeBand(x.recordedAtIso) === timeBand)

  // 3. 日の検索
  if (!q) return bandFiltered

  const dayNumber = Number(q)

  return bandFiltered.filter((x) => {
    const isoDate = x.recordedAtIso.slice(0, 10) // 例: "2025-12-13"

    if (!Number.isNaN(dayNumber)) {
      // 数値として解釈できる場合は「日」を優先して判定（1〜31）
      const day2 = String(dayNumber).padStart(2, '0') // "1" -> "01"
      const targetPrefix = `${month}-${day2}` // 例: "2025-12-13"
      return isoDate.startsWith(targetPrefix)
    }

    // それ以外の入力は、そのまま日付文字列に対する部分一致でざっくり検索
    // 例: "13" -> "2025-12-13" にマッチ
    return isoDate.includes(q)
  })
}

/**
 * ログを日付ごとにまとめるロジック
 * - 「どの順で表示するか」だけを決めている
 */
export function groupLogsByDay(logs: LogItem[]): LogGroup[] {
  const map = new Map<string, LogGroup>()

  for (const item of logs.slice().sort((a, b) => (a.recordedAtIso < b.recordedAtIso ? 1 : -1))) {
    const dayKey = item.recordedAtIso.slice(0, 10)
    const group = map.get(dayKey)

    if (group) {
      group.items.push(item)
      continue
    }

    map.set(dayKey, {
      dayKey,
      dayLabel: formatDayLabel(item.recordedAtIso),
      items: [item],
    })
  }

  return Array.from(map.values())
}

// 指定された "YYYY-MM" 文字列を基準に、月を前後にシフトする
export function shiftMonth(month: string, offset: number): string {
  const d = dayjs(`${month}-01`)
  if (!d.isValid()) return month
  return d.add(offset, 'month').format('YYYY-MM')
}

// YYYY-MMをYYYY年MM月に変換
export function formatMonthLabel(month: string): string {
  const d = dayjs(`${month}-01`)
  if (!d.isValid()) return month
  return d.format('YYYY年MM月')
}
