import { req } from './client'
import type { LogItem } from '@/types/logs'

export async function fetchLogs(month: string): Promise<LogItem[]> {
  const path = `/logs?month=${encodeURIComponent(month)}`
  const res = await req<{ logs: LogItem[] }>(path, {
    method: 'GET',
  })

  return res.logs
}
