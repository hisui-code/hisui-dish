import { Card } from '../ui/card'
import { useMonthTotalInsight } from '@/hooks/useMonthTotalInsight'

/**
 * 今月の合計gを表示するカード。
 */
export default function MonthTotalCard() {
  const x = useMonthTotalInsight()
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">今月の合計</div>
      <div className="mt-1 text-2xl font-semibold">{Math.round(x.monthTotalGrams)} g</div>
      <div className="mt-2 text-sm text-muted-foreground">対象: {x.month}</div>
    </Card>
  )
}
