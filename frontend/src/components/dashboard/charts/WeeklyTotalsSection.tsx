import WeeklyTotalsCard from '@/components/dashboard/charts/WeeklyTotalsCard'
import { useWeeklyTotalsMetrics } from '@/hooks/dashboard/useWeeklyTotals'
import { buildWeeklySeries } from '@/lib/dashboard/weeklySeries'

type WeeklyTotalsSectionProps = {
  rangeLabel: string
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  weekStartIso: string
}

/**
 * @description 週別チャート専用の取得コンポーネント
 * 週移動時はこの境界だけ再取得する
 */
export default function WeeklyTotalSection({
  rangeLabel,
  canNext,
  onPrev,
  onNext,
  weekStartIso,
}: WeeklyTotalsSectionProps) {
  const rows = useWeeklyTotalsMetrics({ weekStartIso, weeks: 6 })
  const series = buildWeeklySeries(rows)

  return (
    <WeeklyTotalsCard
      weekly={{
        rangeLabel,
        canNext,
        onPrev,
        onNext,
        series,
      }}
    />
  )
}
