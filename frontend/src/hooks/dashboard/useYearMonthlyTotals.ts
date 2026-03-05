import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchYearMonthlyTotals } from '@/lib/api/dashboardApi'
import { queryKeys } from '@/lib/queryKeys'
import type { YearMonthlyTotals } from '@/types/dashboard'

/**
 * @description
 * 指定年の「月ごとの合計（1〜12月）」を返すHook
 *
 * @param year - 対象年（"YYYY"）
 * @returns 月別合計の配列（12件）
 */
export function useYearMonthlyTotals(year: string): YearMonthlyTotals {
  const { data } = useSuspenseQuery<YearMonthlyTotals>({
    queryKey: queryKeys.yearMonthlyTotals(year),
    queryFn: () => fetchYearMonthlyTotals(year),
  })

  return data
}
