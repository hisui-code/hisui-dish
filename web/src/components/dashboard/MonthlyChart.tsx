import SimpleBarChart from '@/components/charts/SimpleBarChart'
import type { DashboardData } from '@/types/dashboard'

export type MonthlyChartProps = {
  series: DashboardData['dailySeries']
}

/**
 * @description
 * ダッシュボードの「今月の日別合計」棒グラフ
 */
export default function MonthlyChart({ series }: MonthlyChartProps) {
  return <SimpleBarChart title="📊 今月の日別合計" data={series} xKey="day" yKey="total" />
}
