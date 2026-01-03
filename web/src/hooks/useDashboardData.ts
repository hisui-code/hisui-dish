import { useThisWeekTotal } from '@/hooks/useThisWeekTotal'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import type { DashboardData } from '@/types/dashboard'

export type DashboardMergedData = DashboardData & {
  // 今週の合計g
  thisWeekTotalGrams: number
}

// ReactQueryのキャッシュキー作成
const dashboardQueryKey = (month: string) => ['dashboard', month] as const

export function useDashboardData(month: string): DashboardMergedData {
  // useSuspenseQueryで指定月のダッシュボードデータを取得し、完了まで呼び出し元をサスペンドさせる
  const { data } = useSuspenseQuery<DashboardData>({
    queryKey: dashboardQueryKey(month),
    queryFn: () => fetchDashboard(month),
  })
  // 今週の合計
  const thisWeekTotal = useThisWeekTotal()

  return {
    ...data,
    thisWeekTotalGrams: thisWeekTotal.weekTotalGrams,
  }
}
