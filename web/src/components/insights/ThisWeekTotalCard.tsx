import { Card } from '../ui/card'
import { useThisWeekTotal } from '@/hooks/useThisWeekTotal'
/**
 * 今週（月〜日）の合計gを表示するカード。
 */
export default function ThisWeekTotalCard() {
  const x = useThisWeekTotal()

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">今週の合計</div>
      <div className="mt-1 text-2xl font-semibold">{Math.round(x.weekTotalGrams)} g</div>
      <div className="mt-2 text-sm text-muted-foreground">
        期間: {x.weekStartIso} 〜 {x.weekEndIso}
      </div>
    </Card>
  )
}
