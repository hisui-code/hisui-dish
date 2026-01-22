import { resolveDeviceId } from '../api/config'

/**
 * React Query のキャッシュキー。
 * 月単位でログを共有する。
 */
export const logsQueryKey = (month: string) => {
  const deviceId = resolveDeviceId()
  return ['logs', deviceId, month] as const
}

/**
 * YYYY-MM-DD → YYYY-MM。
 * APIが月指定なので、取得対象の月を作る。
 */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}
