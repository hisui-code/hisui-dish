import { fetchLogs } from '@/lib/api/logsApi'
import { jst } from '@/lib/date'
import { calcMonthTotalMetrics, type MonthTotalMetrics } from '@/lib/resources/metricsResource'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import type { LogItem } from '@/types/logs'
import { useSuspenseQuery } from '@tanstack/react-query'

/**
 * @description 指定月（YYYY-MM）の合計g（メトリクス）を返すHook
 * month未指定の場合は今月（JST）を使う
 * @param month 対象月（YYYY-MM） 未指定の場合は今月（JST）
 * @returns 指定月の合計gと関連情報
 */
export function useMonthTotalMetrics(month?: string): MonthTotalMetrics {
  const targetMonth = month ?? jst().format('YYYY-MM')

  const { data } = useSuspenseQuery<LogItem[]>({
    queryKey: logsQueryKey(targetMonth),
    queryFn: () => fetchLogs(targetMonth),
  })

  return calcMonthTotalMetrics({
    month: targetMonth,
    logs: data.map((x) => ({
      recordedAtIso: x.recordedAtIso,
      grams: x.grams,
    })),
  })
}
