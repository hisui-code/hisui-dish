import { useMemo } from 'react'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import type { DashboardMergedData } from '@/hooks/dashboard/useDashboardData'

/**
 * @description KPIカード表示に使う値
 */
export type DashboardKpisViewModel = {
  /** @description 今日の総摂取量(g) */
  todayTotal: number
  /** @description 現在の残量(g) */
  bowlRemaining: number
  /** @description 直近3ヶ月の1日平均摂取量(g) */
  averageDailyIntakeLast3Months: number
  /** @description 今週合計(g) */
  thisWeekTotalGrams: number
  /** @description 今月合計(g) */
  thisMonthTotalGrams: number
  /** @description 前月との差分(g) */
  thisMonthDiffGrams: number
  /** @description 前月との差分率（前月0のときはnull） */
  thisMonthDiffPct: number | null
}

/**
 * @description 今日の記録カード表示に使う値
 */
export type DashboardTodayViewModel = {
  /** @description 今日のイベント一覧 */
  events: DashboardMergedData['todayEvents']
  /** @description 今日の合計摂取量(g) */
  totalGrams: number
  /** @description 今日の記録件数 */
  count: number
  /** @description 記録の有無 */
  hasEvents: boolean
}

/**
 * @description DashboardのKPIと今日の記録表示を返す
 */
export type DashboardKpisTodayViewModel = {
  /** @description KPIカード用データ */
  kpis: DashboardKpisViewModel
  /** @description 今日の記録カード用データ */
  today: DashboardTodayViewModel
}

/**
 * @description DashboardのKPIと今日の記録表示データを返す
 */
export function useDashboardKpisToday(): DashboardKpisTodayViewModel {
  // ダッシュボード共通の集計データを取得する
  const dashboard = useDashboardData()

  const today = useMemo(() => {
    const totalGrams = dashboard.todayEvents.reduce((sum, event) => sum + event.g, 0)
    const count = dashboard.todayEvents.length
    return {
      events: dashboard.todayEvents,
      totalGrams,
      count,
      hasEvents: count > 0,
    }
  }, [dashboard.todayEvents])

  const kpis: DashboardKpisViewModel = {
    todayTotal: dashboard.todayTotal,
    bowlRemaining: dashboard.bowlRemaining,
    averageDailyIntakeLast3Months: dashboard.averageDailyIntakeLast3Months,
    thisWeekTotalGrams: dashboard.thisWeekTotalGrams,
    thisMonthTotalGrams: dashboard.thisMonthTotalGrams,
    thisMonthDiffGrams: dashboard.thisMonthDiffGrams,
    thisMonthDiffPct: dashboard.thisMonthDiffPct,
  }
  return { kpis, today }
}
