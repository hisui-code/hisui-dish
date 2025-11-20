import type { DashboardData } from '@/types/dashboard'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function fetchDashboard(month: string): Promise<DashboardData> {
  const url = `${BASE}/api/v1/dashboard?month=${encodeURIComponent(month)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return (await res.json()) as DashboardData
  } catch (err) {
    console.error('fetchDashboard failed:', err)
    throw err
  }
}
