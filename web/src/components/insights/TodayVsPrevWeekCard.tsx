import { Card } from '../ui/card'
import { jst } from '@/lib/date'
import { useTodayVsPrevWeekInsight } from '@/hooks/useTodayVsPrevWeekInsight'

function formatGrams(value: number): string {
  return Math.round(value).toLocaleString('ja-JP')
}

function formatMd(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).format('M/D')
}

/**
 * 今日の合計gと、前週（月〜日）の1日平均gを比較して表示するカード。
 */
export default function TodayVsPrevWeekCard() {
  const x = useTodayVsPrevWeekInsight()
  const diffSign = x.diffGrams >= 0 ? '+' : ''

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">今日の合計</div>

      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-3xl font-semibold tabular-nums">{formatGrams(x.todayTotalGrams)}</div>
        <div className="text-sm text-muted-foreground">g</div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        前週平均({formatMd(x.prevWeekStartIso)}〜{formatMd(x.prevWeekEndIso)})
        <span className="ml-1 tabular-nums">{formatGrams(x.prevWeekAvgPerDayGrams)}</span>
        <span className="mt-1">g/日</span>
      </div>

      <div className="mt-1 text-sm">
        差分
        <span className="ml-1 tabular-nums">
          {diffSign}
          {formatGrams(x.diffGrams)}g
        </span>
      </div>
    </Card>
  )
}
