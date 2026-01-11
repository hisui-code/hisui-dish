import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import { useThisWeekTotal } from '@/hooks/useThisWeekTotal'
import { useMonthTotalVsPrev } from '@/hooks/useMonthTotalVsPrev'

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

export function useDashboardData(month: string): DashboardMergedData {
  const { data } = useSuspenseQuery<DashboardData>({
    queryKey: ['dashboard', month],
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
