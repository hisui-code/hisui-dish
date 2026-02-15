import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

import { jst } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SimpleBarChart from '@/components/charts/SimpleBarChart'
import { useYearMonthlyTotals } from '@/hooks/dashboard/useYearMonthlyTotals'

import { FaChartLine } from 'react-icons/fa6'

/**
 * @description
 * 「年別：月ごとの合計（1〜12）」棒グラフ
 */
export default function YearMonthlyTotalsCard() {
  const [year, setYear] = useState<string>(() => jst().format('YYYY'))

  const currentYear = Number(jst().format('YYYY'))
  const canNext = Number(year) < currentYear

  const totals = useYearMonthlyTotals(year)

  const series = useMemo(() => {
    return totals.map((x) => ({
      month: x.month,
      total: x.total,
    }))
  }, [totals])

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
              onClick={() => setYear(String(Number(year) - 1))}
              aria-label="前の年へ"
            >
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <span className="min-w-[88px] text-center text-sm font-medium">{year}年</span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setYear(String(Number(year) + 1))}
              aria-label="次の年へ"
              disabled={!canNext}
            >
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="[&>section]:mt-0 [&>section>h3]:hidden">
        <SimpleBarChart title="" data={series} xKey="month" yKey="total" />
      </CardContent>
    </Card>
  )
}
