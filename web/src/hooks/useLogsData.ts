import { useSuspenseQuery } from '@tanstack/react-query'

import { fetchLogs } from '@/lib/api/logsApi'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import type { LogItem } from '@/types/logs'

/**
 * @description
 * 指定月のログを取得するHook
 * - キャッシュキーは `logsQueryKey(month)` を使用する
 *
 * @param month - 対象月（"YYYY-MM"）
 * @returns 指定月のログ配列
 */
export function useLogsData(month: string): LogItem[] {
  const { data } = useSuspenseQuery<LogItem[]>({
    queryKey: logsQueryKey(month),
    queryFn: () => fetchLogs(month),
  })
  return data
}
