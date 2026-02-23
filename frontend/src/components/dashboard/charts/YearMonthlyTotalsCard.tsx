import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SimpleBarChart from '@/components/charts/SimpleBarChart'
import { FaChartLine } from 'react-icons/fa6'
import type { DashboardYearMonthlyViewModel } from '@/hooks/dashboard/useDashboardPage'

type YearMonthlyTotalsCardProps = {
  yearMonthly: DashboardYearMonthlyViewModel
}

/**
 * @description
 * 「年別：月ごとの合計（1〜12）」棒グラフ
 */
export default function YearMonthlyTotalsCard({ yearMonthly }: YearMonthlyTotalsCardProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2 text-[15px] font-medium text-neutral-800">
            <FaChartLine className="text-emerald-500" aria-hidden="true" />
            <span>月ごとの合計</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={yearMonthly.onPrev}
              aria-label="前の年へ"
            >
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <span className="min-w-[88px] text-center text-sm font-medium">
              {yearMonthly.year}年
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={yearMonthly.onNext}
              aria-label="次の年へ"
              disabled={!yearMonthly.canNext}
            >
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="[&>section]:mt-0 [&>section>h3]:hidden">
        <SimpleBarChart title="" data={yearMonthly.series} xKey="month" yKey="total" />
      </CardContent>
    </Card>
  )
}
