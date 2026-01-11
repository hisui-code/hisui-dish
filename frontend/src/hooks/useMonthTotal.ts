import { fetchLogs } from '@/lib/api/logsApi'
import { jst } from '@/lib/date'
import { calcMonthTotalInsight, type MonthTotalInsight } from '@/lib/resources/metricsResource'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import type { LogItem } from '@/types/logs'
import { useSuspenseQuery } from '@tanstack/react-query'

/**
 * 指定月（YYYY-MM）の合計gを返すHook。
 * month未指定の場合は今月（JST）を使う。
 */
export function useMonthTotalInsight(month?: string): MonthTotalInsight {
  const targetMonth = month ?? jst().format('YYYY-MM')

  const { data } = useSuspenseQuery<LogItem[]>({
    queryKey: logsQueryKey(targetMonth),
    queryFn: () => fetchLogs(targetMonth),
  })

  return calcMonthTotalInsight({
    month: targetMonth,
    logs: data.map((x) => ({
      recordedAtIso: x.recordedAtIso,
      grams: x.grams,
    })),
  })
}
