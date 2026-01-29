import { Suspense } from 'react'
import Kpis from '@/components/dashboard/cards/Kpis'
import TodayList from '@/components/dashboard/cards/TodayList'
import MonthlyChart from '@/components/dashboard/charts/MonthlyChart'
import { useDashboardData } from '@/hooks/useDashboardData'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import WeeklyTotalsCard from '@/components/dashboard/charts/WeeklyTotalsCard'
import YearMonthlyTotalsCard from '@/components/dashboard/charts/YearMonthlyTotalsCard'
import ChartCardSkeleton from '@/components/skeletons/ChartCardSkeleton'

/**
 * @description ダッシュボードの主要セクションを表示する
 * @returns ダッシュボードのメイン画面
 */
function DashboardInner() {
  const data = useDashboardData()

  return (
    <div className="p-3 min-w-0">
      {/* KPI */}
      <Kpis
        data={{
          todayTotal: data.todayTotal,
          bowlRemaining: data.bowlRemaining,
          averageDailyIntakeLast3Months: data.averageDailyIntakeLast3Months,
          thisWeekTotalGrams: data.thisWeekTotalGrams,
          thisMonthTotalGrams: data.thisMonthTotalGrams,
          thisMonthDiffGrams: data.thisMonthDiffGrams,
          thisMonthDiffPct: data.thisMonthDiffPct,
        }}
      />
      {/* 今日の記録 */}
      <TodayList events={data.todayEvents} />
      {/* 日別ごとの合計*/}
      <Suspense fallback={<ChartCardSkeleton />}>
        <MonthlyChart />
      </Suspense>
      <div className="lg:grid lg:grid-cols-2 lg:gap-3 mt-6">
        {/* 週ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <WeeklyTotalsCard />
        </Suspense>
        {/* 月ごとの合計 */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <YearMonthlyTotalsCard />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * @description ダッシュボード画面をサスペンス付きで表示する。
 * @returns ダッシュボード画面
 */
export default function Dashboard() {
  // 通常表示
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  )
}
