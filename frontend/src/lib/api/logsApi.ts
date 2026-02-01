import { req } from './client'
import type { LogItem } from '@/types/logs'
import { resolveDeviceId } from './config'

export async function fetchLogs(month: string): Promise<LogItem[]> {
  const deviceId = resolveDeviceId()
  const searchParams = new URLSearchParams({
    month,
    device_id: deviceId,
  })

  const path = `/api/v1/logs?${searchParams.toString()}`
  const res = await req<{ logs: LogItem[] }>(path, {
    method: 'GET',
  })

  return res.logs
}

/**
 * @description 指定IDのログを削除する
 * @param logId ログID
 * @returns 削除完了を待つPromise
 */
export async function deleteLog(logId: string): Promise<void> {
  await req(`/api/v1/logs/${logId}`, {
    method: 'DELETE',
  })
}
