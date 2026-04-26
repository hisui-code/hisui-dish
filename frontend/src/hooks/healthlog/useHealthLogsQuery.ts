import { useQuery } from '@tanstack/react-query'
import { fetchHealthLogs } from '@/lib/api/healthLogsApi'
import { healthLogsQueryKey } from '@/lib/resources/healthLogsQuery'
import type { HealthLogRecord } from '@/types/healthLog'

/**
 * @description 指定月の健康記録一覧を取得する
 * @param month 対象月
 * @returns 健康記録一覧の取得状態
 */
export function useHealthLogsQuery(month: string) {
  return useQuery<HealthLogRecord[], Error>({
    queryKey: healthLogsQueryKey(month),
    queryFn: () => fetchHealthLogs(month),
  })
}
