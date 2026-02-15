import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import { useThisWeekTotal } from '@/hooks/dashboard/useThisWeekTotal'
import { useMonthTotalVsPrev } from '@/hooks/dashboard/useMonthTotalVsPrev'

import { resolveDeviceId } from '@/lib/api/config'
import { jst } from '@/lib/date'

import type { DashboardData } from '@/types/dashboard'

export type DashboardMergedData = DashboardData & {
  // 今週の合計g
  thisWeekTotalGrams: number
  // 今月の合計g
  thisMonthTotalGrams: number
  // 前月比の差分g
  thisMonthDiffGrams: number
  // 前月比の差分率
  thisMonthDiffPct: number | null
}

export function useDashboardData(): DashboardMergedData {
  const month = jst().format('YYYY-MM')
  const todayJst = jst().format('YYYY-MM-DD')

  // deviceId は API 側で `.env` から解決する（キャッシュキー用に同じ値を参照）
  const deviceId = resolveDeviceId()

  const { data } = useSuspenseQuery<DashboardData>({
    queryKey: ['dashboard', deviceId, month, todayJst],
    queryFn: () => fetchDashboard(month),
  })

  // 今週の合計
  const thisWeekTotal = useThisWeekTotal()

  // 今月の合計と前月比
  const monthVsPrev = useMonthTotalVsPrev()

  return {
    ...data,
    thisWeekTotalGrams: thisWeekTotal.weekTotalGrams,
    thisMonthTotalGrams: monthVsPrev.monthTotalGrams,
    thisMonthDiffGrams: monthVsPrev.diffGrams,
    thisMonthDiffPct: monthVsPrev.diffPct,
  }
}
