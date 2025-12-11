import { useState, Suspense } from 'react'
import Kpis from '@/components/dashboard/Kpis'
import TodayList from '@/components/dashboard/TodayList'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import { useDashboardData } from '@/hooks/useDashboardData'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

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
      <Kpis data={{ todayTotal: data.todayTotal, bowlRemaining: data.bowlRemaining }} />
      {/* 今日の記録 */}
      <TodayList events={data.todayEvents} />
      {/* 今月の日別合計グラフ */}
      <MonthlyChart series={data.dailySeries} />
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
