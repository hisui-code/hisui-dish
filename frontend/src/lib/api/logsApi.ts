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
