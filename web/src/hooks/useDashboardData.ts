import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import type { DashboardData } from '@/types/dashboard'

// ReactQueryのキャッシュキー作成
const dashboardQueryKey = (month: string) => ['dashboard', month] as const

export function useDashboardData(month: string): DashboardData {
  // useSuspenseQueryで指定月のダッシュボードデータを取得し、完了まで呼び出し元をサスペンドさせる
  const { data } = useSuspenseQuery<DashboardData>({
    queryKey: dashboardQueryKey(month),
    queryFn: () => fetchDashboard(month),
  })
  return data
}
