import { resolveDeviceId } from '@/lib/api/config'

const deviceId = resolveDeviceId()

/**
 * @description React Queryキーを一元管理する
 */
export const queryKeys = {
  dashboard: (month: string, todayJst: string) => ['dashboard', deviceId, month, todayJst] as const,
  dailyTotals: (month: string) => ['dailyTotals', deviceId, month] as const,
  yearMonthlyTotals: (year: string) => ['yearMonthlyTotals', deviceId, year] as const,
}
