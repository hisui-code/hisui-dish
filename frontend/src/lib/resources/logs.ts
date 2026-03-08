import dayjs from 'dayjs'
import 'dayjs/locale/ja'

import type { LogItem, LogGroup, TimeBand } from '@/types/logs'

dayjs.locale('ja')

// 画面上で使う時間帯フィルターの表示名
export const timeBandLabels: Record<TimeBand, string> = {
  all: 'すべて',
  morning: '朝',
  daytime: '昼',
  evening: '夕方',
  night: '夜',
}

/**
 * @description ログの記録時刻を一覧表示用の `HH:mm` に変換する
 */
export function formatTime(iso: string): string {
  return dayjs(iso).format('HH:mm')
}

/**
 * @description ログ画面を開いた時に最初に表示する対象月を返す
 */
export function getDefaultMonth(): string {
  return dayjs().format('YYYY-MM')
}

/**
 * @description 日ごとの見出しに使う日付ラベルを返す
 */
export function formatDayLabel(iso: string): string {
  return dayjs(iso).format('M/D(dd)')
}

/**
 * @description 記録時刻から時間帯フィルター用の区分を返す
 */
export function getTimeBand(iso: string): TimeBand {
  const h = dayjs(iso).hour()

  if (h >= 5 && h < 11) return 'morning' // 5:00〜10:59 朝
  if (h >= 11 && h < 16) return 'daytime' // 11:00〜15:59 昼
  if (h >= 16 && h < 22) return 'evening' // 16:00〜21:59 夕方〜夜
  return 'night' // 22:00〜4:59 夜・深夜
}

/**
 * @description ログ一覧を月、時間帯、検索文字列で絞り込む
 * 画面表示用のフィルターだけを担当し、元データは変更しない
 */
export function filterLogs(
  logs: LogItem[],
  month: string,
  query: string,
  timeBand: TimeBand
): LogItem[] {
  const q = query.trim()

  // まず対象月だけに絞って、他月のログを除外する
  const monthFiltered = logs.filter((x) => dayjs(x.recordedAtIso).format('YYYY-MM') === month)

  // 次に選択中の時間帯で絞り込む
  const bandFiltered =
    timeBand === 'all'
      ? monthFiltered
      : monthFiltered.filter((x) => getTimeBand(x.recordedAtIso) === timeBand)

  // 検索文字がなければ、月と時間帯で絞った結果をそのまま返す
  if (!q) return bandFiltered

  const dayNumber = Number(q)

  return bandFiltered.filter((x) => {
    // 日単位の検索に使うため、日付部分だけを取り出す
    const isoDate = dayjs(x.recordedAtIso).format('YYYY-MM-DD')

    if (!Number.isNaN(dayNumber)) {
      // 数値入力の時は「13日」のような日の検索として扱う
      const day2 = String(dayNumber).padStart(2, '0')
      const targetPrefix = `${month}-${day2}`
      return isoDate.startsWith(targetPrefix)
    }

    // 数値以外は日付文字列への部分一致として扱う
    return isoDate.includes(q)
  })
}

/**
 * @description ログを日付ごとにまとめて一覧表示用の配列へ変換する
 */
export function groupLogsByDay(logs: LogItem[]): LogGroup[] {
  const map = new Map<string, LogGroup>()

  // 新しい記録を先頭に出すため、時刻の降順に並べ替える
  const sortedLogs = [...logs].sort((a, b) => b.recordedAtIso.localeCompare(a.recordedAtIso))

  for (const item of sortedLogs) {
    const dayKey = dayjs(item.recordedAtIso).format('YYYY-MM-DD')

    // 日付ごとのグループがまだ無ければここで作る
    const group =
      map.get(dayKey) ??
      (() => {
        const newGroup = {
          dayKey,
          dayLabel: formatDayLabel(item.recordedAtIso),
          items: [] as LogItem[],
        }
        map.set(dayKey, newGroup)
        return newGroup
      })()

    group.items.push(item)
  }

  return Array.from(map.values())
}

/**
 * @description 表示中の月を前後へ移動したい時の月文字列を返す
 */
export function shiftMonth(month: string, offset: number): string {
  const d = dayjs(`${month}-01`)
  if (!d.isValid()) return month
  return d.add(offset, 'month').format('YYYY-MM')
}

/**
 * @description `YYYY-MM` を画面表示用の月ラベルへ変換する
 */
export function formatMonthLabel(month: string): string {
  const d = dayjs(`${month}-01`)
  if (!d.isValid()) return month
  return d.format('YYYY年MM月')
}
