import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchLogs } from '@/lib/api/logsApi'
import type { LogItem } from '@/types/logs'

// ReactQueryのキャッシュキー作成
const logsQueryKey = (month: string) => ['logs', month] as const

export function useLogsData(month: string): LogItem[] {
  const { data } = useSuspenseQuery<LogItem[]>({
    queryKey: logsQueryKey(month),
    queryFn: () => fetchLogs(month),
  })
  return data
}
