import type { DashboardData } from '@/types/dashboard'
import { req } from './client'

export async function fetchDashboard(month: string): Promise<DashboardData> {
  const searchParams = new URLSearchParams({ month })
  const path = `/api/v1/dashboard?${searchParams.toString()}`

  try {
    // req が HTTP ステータスを見てエラーを投げてくれる前提
    return await req<DashboardData>(path)
  } catch (err) {
    console.error('fetchDashboard failed:', err)
    throw err
  }
}
