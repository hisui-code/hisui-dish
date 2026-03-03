import { jst } from '@/lib/date'
import { getWeekStartIsoJst } from '@/lib/resources/metricsResource'
import type { WeeklyTotalRow } from '@/lib/resources/metricsResource'
import type { WeeklyBarChartRow } from '@/components/charts/WeeklyBarChart'

/**
 * @description ISO日付(YYYY-MM-DD)をMM/DDへ整形する
 */
function formatMd(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).format('MM/DD')
}

/**
 * @description 週次集計をWeeklyBarChart表示形式へ変換する
 */
export function buildWeeklySeries(rows: WeeklyTotalRow[]): WeeklyBarChartRow[] {
  const thisWeekStartIso = getWeekStartIsoJst(jst().format('YYYY-MM-DD'))

  return rows.map((row) => {
    // 今週との差分週をWxxへ変換する
    const diffWeeks = jst(`${thisWeekStartIso}T00:00:00`).diff(
      jst(`${row.weekStartIso}T00:00:00`),
      'week'
    )

    return {
      week: `W${String(Math.max(0, diffWeeks)).padStart(2, '0')}`,
      mondayMd: formatMd(row.weekStartIso),
      total: Math.round(row.totalGrams),
    }
  })
}
