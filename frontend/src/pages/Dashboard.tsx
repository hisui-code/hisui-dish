import { Suspense } from 'react'
import Kpis from '@/components/dashboard/cards/Kpis'
import TodayList from '@/components/dashboard/cards/TodayList'
import MonthlyChart from '@/components/dashboard/charts/MonthlyChart'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import WeeklyTotalsCard from '@/components/dashboard/charts/WeeklyTotalsCard'
import YearMonthlyTotalsCard from '@/components/dashboard/charts/YearMonthlyTotalsCard'
import ChartCardSkeleton from '@/components/skeletons/ChartCardSkeleton'
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage'

/**
 * @description ダッシュボードの主要セクションを表示する
 * @returns ダッシュボードのメイン画面
 */
function DashboardInner() {
  const vm = useDashboardPage()

  return (
    <div className="p-3 min-w-0">
      {/* KPI */}
      <Kpis data={vm.kpis} />
      {/* 今日の記録 */}
      <TodayList today={vm.today} />

      {/* 日別ごとの合計*/}
      <Suspense fallback={<ChartCardSkeleton />}>
        <MonthlyChart
          month={vm.monthly.month}
          onChangeMonth={vm.monthly.setMonth}
          series={vm.monthly.series}
        />
      </Suspense>

      <div className="lg:grid lg:grid-cols-2 lg:gap-3 mt-6">
        {/* 週ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <WeeklyTotalsCard weekly={vm.weekly} />
        </Suspense>
        {/* 月ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <YearMonthlyTotalsCard yearMonthly={vm.yearMonthly} />
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
