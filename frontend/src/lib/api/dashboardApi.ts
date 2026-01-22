import type { DashboardData } from '@/types/dashboard'
import { req } from './client'
import { resolveDeviceId } from './config'

/**
 * @description
 * ダッシュボードデータを取得する。deviceId は `.env` の `VITE_DEVICE_ID` を使用する。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns DashboardData
 */
export async function fetchDashboard(month: string): Promise<DashboardData> {
  const resolvedDeviceId = resolveDeviceId()

  const searchParams = new URLSearchParams({ month, device_id: resolvedDeviceId })
  const path = `/api/v1/dashboard?${searchParams.toString()}`

  try {
    // req が HTTP ステータスを見てエラーを投げてくれる前提
    return await req<DashboardData>(path)
  } catch (err) {
    console.error('fetchDashboard failed:', err)
    throw err
  }
}

/**
 * @description
 * 指定月の「日ごとの合計（dailySeries）」だけ取得する。
 * まずは既存の fetchDashboard を再利用して切り出す（API分割は後でやる）。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns 日別合計の配列（DashboardData.dailySeries）
 */
export async function fetchDailySeries(month: string): Promise<DashboardData['dailySeries']> {
  const data = await fetchDashboard(month)
  return data.dailySeries
}
