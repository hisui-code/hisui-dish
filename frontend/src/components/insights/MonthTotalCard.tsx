import { Card } from '@/components/ui/card'
import { useMonthTotalVsPrev } from '@/hooks/useMonthTotalVsPrev'

/**
 * 今月の合計gと前月比較を表示するカード。
 */
export default function MonthTotalCard() {
  const x = useMonthTotalVsPrev()

  const diffSign = x.diffGrams >= 0 ? '+' : ''
  const diffPctLabel = x.diffPct == null ? '—' : `${diffSign}${Math.round(x.diffPct * 100)}%`

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">今月の合計</div>

      <div className="mt-1 text-2xl font-semibold">{Math.round(x.monthTotalGrams)} g</div>

      <div className="mt-2 text-sm text-muted-foreground">対象: {x.month}</div>

      <div className="mt-3 text-sm text-muted-foreground">
        前月: {x.prevMonth}（{Math.round(x.prevMonthTotalGrams)} g）
      </div>

      <div className="mt-1 text-sm">
        差分: {diffSign}
        {Math.round(x.diffGrams)} g（{diffPctLabel}）
      </div>
    </Card>
  )
}
