import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDailySeries } from '@/lib/api/dashboardApi'

import type { DashboardData } from '@/types/dashboard'

/**
 * @description
 * 指定月の「日ごとの合計（dailySeries）」を取得する。
 * 月切り替えは queryKey に month を含めることで自動で再取得される。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns 日別合計（dailySeries）
 */
export function useMonthlyDailySeries(month: string): DashboardData['dailySeries'] {
  const { data } = useSuspenseQuery<DashboardData['dailySeries']>({
    queryKey: ['dailySeries', month],
    queryFn: () => fetchDailySeries(month),
  })
  return data
}
