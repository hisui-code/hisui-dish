import MonthlyChart from '@/components/dashboard/charts/MonthlyChart'
import { useMonthlyDailyTotals } from '@/hooks/dashboard/useMonthlyDailyTotals'

type MonthlyChartSectionProps = {
  month: string
  onChangeMonth: (next: string) => void
}

/**
 * @description 日別チャート専用の取得コンポーネント
 * 月変更時はこの境界だけ再取得する
 */
export default function MonthlyChartSection({ month, onChangeMonth }: MonthlyChartSectionProps) {
  const series = useMonthlyDailyTotals(month)
  return <MonthlyChart month={month} onChangeMonth={onChangeMonth} series={series} />
}
