import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { jst } from '@/lib/date'
import { queryKeys } from '@/lib/queryKeys'
import type { MonthTotalMetrics } from '@/lib/resources/metricsResource'
import { useSuspenseQuery } from '@tanstack/react-query'

/**
 * @description 指定月（YYYY-MM）の合計g（メトリクス）を返すHook
 * month未指定の場合は今月（JST）を使う
 * @param month 対象月（YYYY-MM） 未指定の場合は今月（JST）
 * @returns 指定月の合計gと関連情報
 */
export function useMonthTotalMetrics(month?: string): MonthTotalMetrics {
  const targetMonth = month ?? jst().format('YYYY-MM')

  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dailyTotals(targetMonth),
    queryFn: () => fetchDailyTotals(targetMonth),
  })

  const monthTotalGrams = data.reduce((sum, row) => sum + Number(row.total), 0)

  return {
    month: targetMonth,
    monthTotalGrams,
  }
}
