import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WeeklyBarChart from '@/components/charts/WeeklyBarChart'
import { FaChartLine } from 'react-icons/fa6'
import type { WeeklyBarChartRow } from '@/components/charts/WeeklyBarChart'

type WeeklyTotalsCardProps = {
  weekly: {
    rangeLabel: string
    canNext: boolean
    onPrev: () => void
    onNext: () => void
    series: WeeklyBarChartRow[]
  }
}
/**
 * @description
 * 「週ごとの合計」棒グラフ
 *
 * - X軸は W00 を今週として W01, W02… を過去方向に付ける
 * - 矢印の間は 表示期間（先頭週月曜〜最終日）を表示する
 */
export default function WeeklyTotalsCard({ weekly }: WeeklyTotalsCardProps) {
  return (
    <Card className="rounded-xl shadow-sm mb-6 lg:mb-0">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <h3 className="flex shrink-0 items-center gap-2 text-[15px] font-medium text-neutral-800">
            <FaChartLine className="text-emerald-500" aria-hidden="true" />
            <span>週ごとの合計</span>
          </h3>

          <div className="flex items-center gap-2 ml-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={weekly.onPrev}
              aria-label="前の期間へ"
            >
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <span className="min-w-[120px] text-center text-sm font-medium">
              {weekly.rangeLabel}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={weekly.onNext}
              aria-label="次の期間へ"
              disabled={!weekly.canNext}
            >
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <WeeklyBarChart data={weekly.series} />
      </CardContent>
    </Card>
  )
}
