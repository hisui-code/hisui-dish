import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { jst } from '@/lib/date'
import {
  addDaysIsoJst,
  buildDailyTotals,
  calcThisWeekTotalMetrics,
  getWeekStartIsoJst,
} from '@/lib/resources/metricsResource'

import type { DailyTotals } from '@/types/dashboard'
import type { ThisWeekTotal } from '@/lib/resources/metricsResource'

/**
 * @description 日別合計を計算用Map(YYYY-MM-DD => total)へ変換する
 * @param dailyTotals 日別合計配列
 * @param month 対象月（YYYY-MM）
 */
function toDailyTotalsMap(dailyTotals: DailyTotals, month: string) {
  const logs = dailyTotals.map((x) => ({
    // 日別合計のみ使うので時刻は固定値で十分
    recordedAtIso: `${month}-${String(x.day).padStart(2, '0')}T00:00:00+09:00`,
    grams: Number(x.total),
  }))

  return buildDailyTotals(logs)
}

/**
 * 今週（月〜日）の合計gを返す。
 */
export function useThisWeekTotal(): ThisWeekTotal {
  // 今日（JST）
  const todayIso = jst().format('YYYY-MM-DD')

  // 今週の開始（月曜）
  const weekStart = getWeekStartIsoJst(todayIso)

  // 今週の終了（日曜）
  const weekEnd = addDaysIsoJst(weekStart, 6)

  // 取得対象の月（週が別月になるケースに対応）
  const monthOf = (isoDay: string) => jst(`${isoDay}T00:00:00`).format('YYYY-MM')
  const months = Array.from(new Set([monthOf(weekStart), monthOf(weekEnd)]))

  // 月ごとのログを取得（monthsの順で結果が返る）
  const results = useSuspenseQueries({
    queries: months.map((m) => ({
      queryKey: ['daily_totals', m],
      queryFn: () => fetchDailyTotals(m),
    })),
  })

  // 取得した月分を結合して、週計算用の日別Mapを作る
  const mergedDailyTotals = new Map<string, number>()
  for (let i = 0; i < months.length; i++) {
    const month = months[i]
    const dailyTotals = results[i].data as DailyTotals
    const map = toDailyTotalsMap(dailyTotals, month)
    for (const [dateKey, total] of map.entries()) {
      mergedDailyTotals.set(dateKey, total)
    }
  }

  // 今週（月〜日）の合計gを返す
  return calcThisWeekTotalMetrics({
    todayIso,
    dailyTotals: mergedDailyTotals,
  })
}
