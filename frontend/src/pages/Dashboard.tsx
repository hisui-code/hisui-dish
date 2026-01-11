import { useState, Suspense } from 'react'
import Kpis from '@/components/dashboard/Kpis'
import TodayList from '@/components/dashboard/TodayList'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import { useDashboardData } from '@/hooks/useDashboardData'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import WeeklyTotalsCard from '@/components/dashboard/charts/WeeklyTotalsCard'
import YearMonthlyTotalsCard from '@/components/dashboard/charts/YearMonthlyTotalsCard'

// 月を "YYYY-MM" 形式にフォーマット
const fmtMonth = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function DashboardInner() {
  const [month] = useState<string>(() => fmtMonth(new Date()))
  const data = useDashboardData(month)

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
      {/* 今月の日別合計グラフ */}
      <MonthlyChart series={data.dailySeries} />

      <div className="lg:grid lg:grid-cols-2 lg:gap-3 mt-6">
        {/* 週ごとの合計 */}
        <WeeklyTotalsCard />
        {/* 月ごとの合計 */}
        <YearMonthlyTotalsCard />
      </div>
    </div>
  )
}

export default function DashBoard() {
  // 通常表示
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  )
}
