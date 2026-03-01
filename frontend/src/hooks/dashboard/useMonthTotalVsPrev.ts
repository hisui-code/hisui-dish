import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { jst } from '@/lib/date'
import { calcMonthTotalVsPrev } from '@/lib/resources/metricsResource'

import type { DailyTotals } from '@/types/dashboard'
import type { MonthTotalVsPrev } from '@/lib/resources/metricsResource'

/**
 * @description 日別合計配列をメトリクス計算用形式に変換する
 */
function toMetricsLogsFromDailyTotals(dailyTotals: DailyTotals, month: string) {
  return dailyTotals
    .filter((x) => Number(x.total) > 0)
    .map((x) => ({
      // 月次比較は日単位合計だけ使うため、時刻はJST 00:00:00固定で問題ない
      recordedAtIso: `${month}-${String(x.day).padStart(2, '0')}T00:00:00+09:00`,
      grams: Number(x.total),
    }))
}

/**
 * @description 今月合計と前月合計の比較メトリクスを返すHook
 * month未指定の場合は今月（JST）を使う
 * @param month 対象月（YYYY-MM）。未指定の場合は今月（JST）
 * @returns 今月と前月の合計g比較結果
 */
export function useMonthTotalVsPrev(month?: string): MonthTotalVsPrev {
  const targetMonth = month ?? jst().format('YYYY-MM')
  const prevMonth = jst(`${targetMonth}-01`).subtract(1, 'month').format('YYYY-MM')

  const results = useSuspenseQueries({
    queries: [targetMonth, prevMonth].map((m) => ({
      queryKey: ['daily_totals', m],
      queryFn: () => fetchDailyTotals(m),
    })),
  })

  const monthDailyTotals = results[0].data as DailyTotals
  const prevDailyTotals = results[1].data as DailyTotals

  return calcMonthTotalVsPrev({
    month: targetMonth,
    monthLogs: toMetricsLogsFromDailyTotals(monthDailyTotals, targetMonth),
    prevMonth,
    prevMonthLogs: toMetricsLogsFromDailyTotals(prevDailyTotals, prevMonth),
  })
}
