import { useMemo, useState } from 'react'
import { jst } from '@/lib/date'
import { getWeekStartIsoJst } from '@/lib/resources/metricsResource'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import { useMonthlyDailyTotals } from '@/hooks/dashboard/useMonthlyDailyTotals'
import { useWeeklyTotalsMetrics } from '@/hooks/dashboard/useWeeklyTotals'
import { useYearMonthlyTotals } from '@/hooks/dashboard/useYearMonthlyTotals'
import type { WeeklyBarChartRow } from '@/components/charts/WeeklyBarChart'
import type { DailyTotals, YearMonthlyTotals } from '@/types/dashboard'
import type { DashboardMergedData } from '@/hooks/dashboard/useDashboardData'

/**
 * @description KPIセクションに表示する値
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
  /** @description 前月との差分率(前月0のときはnull) */
  thisMonthDiffPct: number | null
}

/**
 * @description 今日の記録セクションに表示する値
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
 * @description 日別チャート(月単位)の表示状態
 */
export type DashboardMonthlyViewModel = {
  /** @description 選択中の対象月(YYYY-MM) */
  month: string
  /** @description 対象月を更新する */
  setMonth: (next: string) => void
  /** @description 対象月の日別合計系列 */
  series: DailyTotals
}

/**
 * @description 週別チャートの表示状態
 */
export type DashboardWeeklyViewModel = {
  /**
   * @description 表示期間の先頭週(月曜, JST)
   * 形式は YYYY-MM-DD
   */
  weekStartIso: string
  /** @description 期間表示ラベル(例: 02/02〜03/15) */
  rangeLabel: string
  /** @description 未来期間へ進めるかどうか */
  canNext: boolean
  /** @description 1期間ぶん過去へ移動する */
  onPrev: () => void
  /** @description 1期間ぶん未来へ移動する */
  onNext: () => void
  /** @description 週別棒グラフ表示用データ */
  series: WeeklyBarChartRow[]
}

/**
 * @description 月別チャート(年単位)の表示状態
 */
export type DashboardYearMonthlyViewModel = {
  /** @description 選択中の対象年(YYYY) */
  year: string
  /** @description 未来年へ進めるかどうか */
  canNext: boolean
  /** @description 前年へ移動する */
  onPrev: () => void
  /** @description 翌年へ移動する */
  onNext: () => void
  /** @description 対象年の月別合計系列 */
  series: YearMonthlyTotals
}

/**
 * @description Dashboardページ全体の表示用ViewModel
 * PageはこのViewModelを配下コンポーネントへ渡すだけにする
 */
export type DashboardPageViewModel = {
  /** @description KPIセクション用データ */
  kpis: DashboardKpisViewModel
  /** @description 今日の記録セクション用データ */
  today: DashboardTodayViewModel
  /** @description 日別チャート(月)用データ */
  monthly: DashboardMonthlyViewModel
  /** @description 週別チャート用データ */
  weekly: DashboardWeeklyViewModel
  /** @description 月別チャート(年)用データ */
  yearMonthly: DashboardYearMonthlyViewModel
}

const WEEKS = 6

/**
 * @description ISO日付(YYYY-MM-DD)をMM/DDへ整形する
 */
function formatMd(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).format('MM/DD')
}

/**
 * @description 今日の記録一覧から表示サマリを作る
 */
function buildTodaySummary(events: DashboardMergedData['todayEvents']) {
  // 今日イベントから表示用の合計gを算出する
  const totalGrams = events.reduce((sum, event) => sum + event.g, 0)
  // 件数は配列長をそのまま使う
  const count = events.length

  return {
    totalGrams,
    count,
    hasEvents: count > 0,
  }
}

/**
 * @description 週次メトリクスをWeeklyBarChart表示用へ変換する
 */
function buildWeeklySeries(
  rows: ReturnType<typeof useWeeklyTotalsMetrics>,
  thisWeekStartIso: string
): WeeklyBarChartRow[] {
  return rows.map((row) => {
    // 今週開始日との差分週を求めてWxxラベルへ変換する
    const diffWeeks = jst(`${thisWeekStartIso}T00:00:00`).diff(
      jst(`${row.weekStartIso}T00:00:00`),
      'week'
    )
    return {
      week: `W${String(Math.max(0, diffWeeks)).padStart(2, '0')}`,
      mondayMd: formatMd(row.weekStartIso),
      total: Math.round(row.totalGrams),
    }
  })
}

/**
 * @description Dashboardページの表示用ViewModelを集約する
 */
export function useDashboardPage(): DashboardPageViewModel {
  // ダッシュボード共通の集計データを取得する
  const dashboard = useDashboardData()

  // 日別チャート用の対象月カーソル
  const [month, setMonth] = useState<string>(() => jst().format('YYYY-MM'))
  // 年別チャート用の対象年カーソル
  const [year, setYear] = useState<string>(() => jst().format('YYYY'))

  // 週次表示の基準となる今週月曜をJSTで求める
  const thisWeekStartIso = getWeekStartIsoJst(jst().format('YYYY-MM-DD'))
  // 週次チャートの表示開始週を保持する
  const [weekStartIso, setWeekStartIso] = useState<string>(() =>
    jst(`${thisWeekStartIso}T00:00:00`)
      .add(-(WEEKS - 1) * 7, 'day')
      .format('YYYY-MM-DD')
  )

  // 各セクションの系列データを取得する
  const dailySeries = useMonthlyDailyTotals(month)
  const weeklyRows = useWeeklyTotalsMetrics({ weekStartIso, weeks: WEEKS })
  const yearSeries = useYearMonthlyTotals(year)

  // 先頭週から6週間ぶんの「最新週の月曜」を計算する
  const latestWeekStartIso = useMemo(() => {
    return jst(`${weekStartIso}T00:00:00`)
      .add((WEEKS - 1) * 7, 'day')
      .format('YYYY-MM-DD')
  }, [weekStartIso])

  // ヘッダー表示用の期間ラベルを作る
  // 表示は「先頭週の月曜〜最新週の月曜」で統一する
  const weeklyRangeLabel = useMemo(() => {
    return `${formatMd(weekStartIso)}の週〜${formatMd(latestWeekStartIso)}の週`
  }, [weekStartIso, latestWeekStartIso])

  // 今週を超える未来期間には進ませない
  const weeklyCanNext = weekStartIso < thisWeekStartIso

  // 年別チャートは現在年を超えないよう制御する
  const currentYear = Number(jst().format('YYYY'))
  const yearCanNext = Number(year) < currentYear

  // 週次集計をWeeklyBarChartの描画形式へ整形する
  const weeklySeries = useMemo(() => {
    return buildWeeklySeries(weeklyRows, thisWeekStartIso)
  }, [weeklyRows, thisWeekStartIso])

  // 今日の記録一覧からサマリ値だけを導出する
  const todaySummary = useMemo(
    () => buildTodaySummary(dashboard.todayEvents),
    [dashboard.todayEvents]
  )

  // 表示範囲を6週間ぶん過去へ移動する
  const onWeeklyPrev = () => {
    setWeekStartIso((prev) =>
      jst(`${prev}T00:00:00`)
        .add(-WEEKS * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }

  // 表示範囲を6週間ぶん未来へ移動する
  const onWeeklyNext = () => {
    // 未来期間に入る操作は無効化する
    if (!weeklyCanNext) return
    // 先頭週を6週間ぶん進めて表示期間を未来側へ移動する
    setWeekStartIso((prev) =>
      jst(`${prev}T00:00:00`)
        .add(WEEKS * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }
  // 年カーソルを1年戻す
  const onYearPrev = () => {
    setYear(String(Number(year) - 1))
  }
  // 年カーソルを1年進める
  const onYearNext = () => {
    // 現在年より未来へは進ませない
    if (!yearCanNext) return
    setYear(String(Number(year) + 1))
  }

  return {
    kpis: {
      todayTotal: dashboard.todayTotal,
      bowlRemaining: dashboard.bowlRemaining,
      averageDailyIntakeLast3Months: dashboard.averageDailyIntakeLast3Months,
      thisWeekTotalGrams: dashboard.thisWeekTotalGrams,
      thisMonthTotalGrams: dashboard.thisMonthTotalGrams,
      thisMonthDiffGrams: dashboard.thisMonthDiffGrams,
      thisMonthDiffPct: dashboard.thisMonthDiffPct,
    },
    today: {
      events: dashboard.todayEvents,
      totalGrams: todaySummary.totalGrams,
      count: todaySummary.count,
      hasEvents: todaySummary.hasEvents,
    },
    monthly: {
      month,
      setMonth,
      series: dailySeries,
    },
    weekly: {
      weekStartIso,
      rangeLabel: weeklyRangeLabel,
      canNext: weeklyCanNext,
      onPrev: onWeeklyPrev,
      onNext: onWeeklyNext,
      series: weeklySeries,
    },
    yearMonthly: {
      year,
      canNext: yearCanNext,
      onPrev: onYearPrev,
      onNext: onYearNext,
      series: yearSeries,
    },
  }
}
