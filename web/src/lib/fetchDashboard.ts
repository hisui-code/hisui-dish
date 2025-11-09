import type { DashboardData } from '@/types/dashboard'

export async function fetchDashboard(month: string): Promise<DashboardData> {
  const url = `/api/v1/dashboard?month=${encodeURIComponent(month)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard data: ${res.status}`)
  }

  const json = (await res.json()) as DashboardData

  if (!Array.isArray(json.todayEvents)) {
    throw new Error(`invalid payload: todayEvents`)
  }

  return json
}
