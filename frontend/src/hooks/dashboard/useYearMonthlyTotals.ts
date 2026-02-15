import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchYearMonthlyTotals } from '@/lib/api/dashboardApi'
import type { YearMonthlyTotals } from '@/types/dashboard'
import { resolveDeviceId } from '@/lib/api/config'

/**
/**
 * @description
 * 指定年の「月ごとの合計（1〜12月）」を返すHook
 *
 * @param year - 対象年（"YYYY"）
 * @returns 月別合計の配列（12件）
 */

export function useYearMonthlyTotals(year: string): YearMonthlyTotals {
  const deviceId = resolveDeviceId()
  const queryKey = ['yearMonthlyTotals', deviceId, year]

  const { data } = useSuspenseQuery<YearMonthlyTotals>({
    queryKey,
    queryFn: () => fetchYearMonthlyTotals(year),
  })

  return data
}
