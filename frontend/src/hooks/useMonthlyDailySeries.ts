import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'

import { jst } from '@/lib/date'

import type { DailyTotals } from '@/types/dashboard'

/**
 * @description
 * 指定月の「日ごとの合計（dailyTotals）」を取得する。
 * 月切り替えは queryKey に month を含めることで自動で再取得される。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns 日別合計（dailyTotals）
 */
export function useMonthlyDailyTotals(month: string): DailyTotals {
  const todayJst = jst().format('YYYY-MM-DD')
  const currentMonth = jst().format('YYYY-MM')
  // 当月は日ごとに再取得され、過去月はキャッシュ
  // 当月は年月日をqueryKey
  // 過去月は年月をqueryKey
  const queryKey =
    month === currentMonth ? ['dailyTotals', month, todayJst] : ['dailyTotals', month]

  const { data } = useSuspenseQuery<DailyTotals>({
    queryKey: queryKey,
    queryFn: () => fetchDailyTotals(month),
  })
  return data
}
