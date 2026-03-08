import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { jst } from '@/lib/date'
import { calcMonthTotalVsPrev } from '@/lib/resources/metricsResource'
import { queryKeys } from '@/lib/queryKeys'
import type { DailyTotals } from '@/types/dashboard'
import type { MonthTotalVsPrev } from '@/lib/resources/metricsResource'

/**
 * @description 日別合計配列をメトリクス計算用形式に変換する
 */
function toMetricsLogsFromDailyTotals(dailyTotals: DailyTotals, month: string) {
  return dailyTotals
    .filter((x) => Number(x.total) > 0)
    .map((x) => ({
      // 月次比較は日単位合計だけ使うため、時刻はJST 00:00:00固定で問題ない
      recordedAtIso: `${month}-${String(x.day).padStart(2, '0')}T00:00:00+09:00`,
      grams: Number(x.total),
    }))
}

/**
 * @description 今月合計と前月合計の比較メトリクスを返すHook
 * month未指定の場合は今月（JST）を使う
 * @param month 対象月（YYYY-MM）。未指定の場合は今月（JST）
 * @returns 今月と前月の合計g比較結果
 */
export function useMonthTotalVsPrev(month?: string): MonthTotalVsPrev {
  // 未指定時はJSTの今月を基準にする
  const targetMonth = month ?? jst().format('YYYY-MM')
  // 比較対象として前月を求める
  const prevMonth = jst(`${targetMonth}-01`).subtract(1, 'month').format('YYYY-MM')

  // 今月と前月の日別合計を同時に取得する
  const results = useSuspenseQueries({
    queries: [targetMonth, prevMonth].map((m) => ({
      queryKey: queryKeys.dailyTotals(m),
      queryFn: () => fetchDailyTotals(m),
    })),
  })

  const monthDailyTotals = results[0].data as DailyTotals
  const prevDailyTotals = results[1].data as DailyTotals

  // 日別合計を比較用の形式へ変換して、今月と前月の差分を計算する
  return calcMonthTotalVsPrev({
    month: targetMonth,
    monthLogs: toMetricsLogsFromDailyTotals(monthDailyTotals, targetMonth),
    prevMonth,
    prevMonthLogs: toMetricsLogsFromDailyTotals(prevDailyTotals, prevMonth),
  })
}
