import { Suspense } from 'react'
import Kpis from '@/components/dashboard/cards/Kpis'
import TodayList from '@/components/dashboard/cards/TodayList'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import ChartCardSkeleton from '@/components/skeletons/ChartCardSkeleton'
import MonthlyChartSection from '@/components/dashboard/charts/MonthlyChartSection'
import WeeklyTotalSection from '@/components/dashboard/charts/WeeklyTotalsSection'
import YearMonthlySection from '@/components/dashboard/charts/YearMonthlySection'
import { useDashboardState } from '@/hooks/dashboard/useDashboardState'
import { useDashboardKpisToday } from '@/hooks/dashboard/useDashboardKpisToday'

/**
 * @description ダッシュボードの主要セクションを表示する
 * @returns ダッシュボードのメイン画面
 */
function DashboardInner() {
  const state = useDashboardState()
  const vm = useDashboardKpisToday()

  return (
    <div className="p-3 min-w-0">
      {/* KPI */}
      <Kpis data={vm.kpis} />
      {/* 今日の記録 */}
      <TodayList today={vm.today} />

      {/* 日別ごとの合計*/}
      <Suspense fallback={<ChartCardSkeleton />}>
        <MonthlyChartSection month={state.monthly.month} onChangeMonth={state.monthly.setMonth} />
      </Suspense>

      <div className="lg:grid lg:grid-cols-2 lg:gap-3 mt-6">
        {/* 週ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <WeeklyTotalSection
            rangeLabel={state.weekly.rangeLabel}
            canNext={state.weekly.canNext}
            onPrev={state.weekly.onPrev}
            onNext={state.weekly.onNext}
            weekStartIso={state.weekly.weekStartIso}
          />
        </Suspense>
        {/* 月ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <YearMonthlySection
            year={state.yearMonthly.year}
            canNext={state.yearMonthly.canNext}
            onPrev={state.yearMonthly.onPrev}
            onNext={state.yearMonthly.onNext}
          />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * @description ダッシュボード画面を表示
 */
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  )
}
