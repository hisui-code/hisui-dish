import { req } from './client'
import { resolveDeviceId } from './config'

import type { DashboardData, DailyTotals } from '@/types/dashboard'

const resolvedDeviceId = resolveDeviceId()
/**
 * @description
 * ダッシュボードデータを取得する。deviceId は `.env` の `VITE_DEVICE_ID` を使用する。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns DashboardData
 */
export async function fetchDashboard(month: string): Promise<DashboardData> {
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
 * 指定月の「日ごとの合計（dailyTotals）」のみ取得する。
 *
 * @param month - 対象月（YYYY-MM）
 * @returns 日別合計の配列（DashboardData.dailyTotals）
 */
export async function fetchDailyTotals(month: string): Promise<DailyTotals> {
  const searchParams = new URLSearchParams({ month, device_id: resolvedDeviceId })
  const path = `/api/v1/daily_totals?${searchParams.toString()}`

  try {
    return await req<DailyTotals>(path)
  } catch (err) {
    console.log('fetchDailyTotals', err)
    throw err
  }
}
