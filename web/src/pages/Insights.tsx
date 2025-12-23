import { Suspense } from 'react'
import TodayVsPrevWeekCard from '@/components/insights/TodayVsPrevWeekCard'
import ThisWeekTotalCard from '@/components/insights/ThisWeekTotalCard'
import MonthTotalCard from '@/components/insights/MonthTotalCard'

function InsightsContent() {
  return (
    <div className="space-y-4 p-4">
      <TodayVsPrevWeekCard />
    </div>
  )
}

/**
 * インサイトページ。
 * Suspense Query を使うので、ページ内で Suspense fallback を用意する。
 */
export default function Insights() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading...</div>}>
      <InsightsContent />
      <ThisWeekTotalCard />
      <MonthTotalCard />
    </Suspense>
  )
}
