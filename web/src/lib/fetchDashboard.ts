import type { DashboardData } from '@/types/dashboard'

// monthは "2025-11" のようなYYYY-MM
export async function fetchDashboard(month: string): Promise<DashboardData> {
  const url = `/api/v1/dashboard?month=${encodeURIComponent(month)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard data: ${res.status}`)
  }

  const json = (await res.json()) as DashboardData
  // TODO: 必要ならキー変換・バリデーションを追加
  return json
}
