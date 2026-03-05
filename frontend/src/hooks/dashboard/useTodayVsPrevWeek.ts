import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { jst } from '@/lib/date'
import {
  addDaysIsoJst,
  calcTodayVsPrevWeekMetrics,
  getWeekStartIsoJst,
} from '@/lib/resources/metricsResource'
import { monthOf } from '@/lib/resources/logsQuery'
import { queryKeys } from '@/lib/queryKeys'

import type { TodayVsPrevWeekMetrics } from '@/lib/resources/metricsResource'

/**
 * @description 「今日の合計」と「前週(月〜日)の1日平均」の比較メトリクスを返すHook
 * 月またぎ（前週が別月）に備えて、必要な月ログを最大2ヶ月分だけ取得する
 * @returns 今日合計と前週平均の比較結果
 */
export function useTodayVsPrevWeekMetrics(): TodayVsPrevWeekMetrics {
  // 今日（JST）
  const todayIso = jst().format('YYYY-MM-DD')

  // 今週の開始（月曜）
  const thisWeekStart = getWeekStartIsoJst(todayIso)

  // 前週の開始（月曜）
  const prevWeekStart = addDaysIsoJst(thisWeekStart, -7)

  // 取得対象の月（前週が別月になるケースに対応）
  const months = Array.from(new Set([monthOf(todayIso), monthOf(prevWeekStart)]))

  // 月ごとのログを取得（monthsの順で結果が返る）
  const results = useSuspenseQueries({
    queries: months.map((m) => ({
      queryKey: queryKeys.dailyTotals(m),
      queryFn: () => fetchDailyTotals(m),
    })),
  })

  const dailyTotals = new Map<string, number>()
  for (let i = 0; i < months.length; i++) {
    const month = months[i]
    const rows = results[i].data
    for (const row of rows) {
      const day = String(row.day).padStart(2, '0')
      dailyTotals.set(`${month}-${day}`, Number(row.total))
    }
  }

  return calcTodayVsPrevWeekMetrics({ todayIso, dailyTotals })
}
