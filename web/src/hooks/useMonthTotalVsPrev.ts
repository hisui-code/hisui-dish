import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchLogs } from '@/lib/api/logsApi'
import { jst } from '@/lib/date'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import { calcMonthTotalVsPrev } from '@/lib/resources/metricsResource'

import type { LogItem } from '@/types/logs'
import type { MonthTotalVsPrev } from '@/lib/resources/metricsResource'

function toInsightLogs(items: LogItem[]) {
  return items.map((x) => ({
    recordedAtIso: x.recordedAtIso,
    grams: x.grams,
  }))
}

/**
 * 今月合計と前月合計の比較データを返すHook。
 * month未指定の場合は今月（JST）を使う。
 */
export function useMonthTotalVsPrev(month?: string): MonthTotalVsPrev {
  const targetMonth = month ?? jst().format('YYYY-MM')
  const prevMonth = jst(`${targetMonth}-01`).subtract(1, 'month').format('YYYY-MM')

  const results = useSuspenseQueries({
    queries: [targetMonth, prevMonth].map((m) => ({
      queryKey: logsQueryKey(m),
      queryFn: () => fetchLogs(m),
    })),
  })

  const monthLogs = results[0].data as LogItem[]
  const prevLogs = results[1].data as LogItem[]

  return calcMonthTotalVsPrev({
    month: targetMonth,
    monthLogs: toInsightLogs(monthLogs),
    prevMonth,
    prevMonthLogs: toInsightLogs(prevLogs),
  })
}
