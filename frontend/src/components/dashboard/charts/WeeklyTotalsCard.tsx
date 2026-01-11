import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

import { jst } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeekStartIsoJst } from '@/lib/resources/metricsResource'
import { useWeeklyTotalsInsight } from '@/hooks/useWeeklyTotals'
import WeeklyBarChart from '@/components/charts/WeeklyBarChart'

import type { WeeklyBarChartRow } from '@/components/charts/WeeklyBarChart'

import { FaChartLine } from 'react-icons/fa6'

// 表示用に ISO日付（YYYY-MM-DD）を MM/DD に変換する
function formatMd(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).format('MM/DD')
}

/**
 * @description
 * 「週ごとの合計」棒グラフ
 *
 * - 表示は直近6週
 * - X軸は W00 を今週として W01, W02… を過去方向に付ける
 * - 矢印の間は 表示期間（先頭週月曜〜最終日）を表示する
 */
export default function WeeklyTotalsCard() {
  const weeks = 6

  // 今週の開始日（月曜, JST）
  const thisWeekStartIso = getWeekStartIsoJst(jst().format('YYYY-MM-DD'))

  // 表示の先頭週（月曜）。初期表示は今週から5週前
  const [weekStartIso, setWeekStartIso] = useState<string>(() => {
    return jst(`${thisWeekStartIso}T00:00:00`)
      .add(-(weeks - 1) * 7, 'day')
      .format('YYYY-MM-DD')
  })

  // 表示範囲の最終日（先頭週から weeks 週ぶん）
  const endIso = useMemo(() => {
    return jst(`${weekStartIso}T00:00:00`)
      .add(weeks * 7 - 1, 'day')
      .format('YYYY-MM-DD')
  }, [weekStartIso, weeks])

  // 矢印の間に出す期間表示（MM/DD〜MM/DD）
  const rangeLabel = useMemo(() => {
    return `${formatMd(weekStartIso)}〜${formatMd(endIso)}`
  }, [weekStartIso, endIso])

  // 未来週へは進めない
  const canNext = weekStartIso < thisWeekStartIso

  // 表示範囲（先頭週から weeks 週）に対する週別合計
  const rows = useWeeklyTotalsInsight({ weekStartIso, weeks })

  const series: WeeklyBarChartRow[] = useMemo(() => {
    return rows.map((x) => {
      // 今週を W00 として週差分から Wxx を作る
      const diffWeeks = jst(`${thisWeekStartIso}T00:00:00`).diff(
        jst(`${x.weekStartIso}T00:00:00`),
        'week'
      )
      const week = `W${String(Math.max(0, diffWeeks)).padStart(2, '0')}`

      return {
        week,
        mondayMd: formatMd(x.weekStartIso),
        total: Math.round(x.totalGrams),
      }
    })
  }, [rows, thisWeekStartIso])

  // 表示範囲を過去へ移動する（現在の先頭から weeks 週ぶん戻す）
  const handlePrev = () => {
    setWeekStartIso(
      jst(`${weekStartIso}T00:00:00`)
        .add(-weeks * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }

  // 表示範囲を未来へ移動する（現在の先頭から weeks 週ぶん進める）
  const handleNext = () => {
    setWeekStartIso(
      jst(`${weekStartIso}T00:00:00`)
        .add(weeks * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }

  return (
    <Card className="mt-6 rounded-xl shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-neutral-800">
            <FaChartLine className="text-emerald-500" aria-hidden="true" />
            <span>週ごとの合計</span>
          </h3>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handlePrev}
              aria-label="前の期間へ"
            >
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <span className="min-w-[160px] text-center text-sm font-medium">{rangeLabel}</span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleNext}
              aria-label="次の期間へ"
              disabled={!canNext}
            >
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <WeeklyBarChart data={series} />
      </CardContent>
    </Card>
  )
}
