import YearMonthlyTotalsCard from '@/components/dashboard/charts/YearMonthlyTotalsCard'
import { useYearMonthlyTotals } from '@/hooks/dashboard/useYearMonthlyTotals'

type YearMonthlySectionProps = {
  year: string
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}

/**
 * @description 年別チャート専用の取得コンポーネント
 * 年移動時はこの境界だけ再取得する
 */
export default function YearMonthlySection({
  year,
  canNext,
  onPrev,
  onNext,
}: YearMonthlySectionProps) {
  const series = useYearMonthlyTotals(year)

  return (
    <YearMonthlyTotalsCard
      yearMonthly={{
        year,
        canNext,
        onPrev,
        onNext,
        series,
      }}
    />
  )
}
