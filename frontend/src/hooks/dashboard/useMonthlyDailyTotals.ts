import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { queryKeys } from '@/lib/queryKeys'
import type { DailyTotals } from '@/types/dashboard'

/**
 * @description
 * 指定月の「日ごとの合計（dailyTotals）」を取得する
 * 月切り替えは queryKey に month を含めることで自動で再取得される
 *
 * @param month - 対象月（YYYY-MM）
 * @returns 日別合計（dailyTotals）
 */
export function useMonthlyDailyTotals(month: string): DailyTotals {
  const { data } = useSuspenseQuery<DailyTotals>({
    queryKey: queryKeys.dailyTotals(month),
    queryFn: () => fetchDailyTotals(month),
  })
  return data
}
