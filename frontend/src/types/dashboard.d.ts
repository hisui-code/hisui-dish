/**
 * @description 今日の記録（時刻と摂取量）
 */
export type TodayEvent = { time: string; g: number }

/**
 * @description ダッシュボード表示に必要な集計データ
 */
export type DashboardData = {
  todayEvents: TodayEvent[]
  // 今日1日の合計摂取量（g）
  todayTotal: number
  // ボウルに残っているごはんの量（g）
  bowlRemaining: number
  // 過去最大3ヶ月分を対象にした1日あたりの平均摂取量（g/日）
  averageDailyIntakeLast3Months: number
}
/**
 * @description 日別合計の1要素（day=日付, total=合計g）
 */
export type DayTotal = { day: string; total: number }

/**
 * @description 日別合計の配列（daily totals）
 */
export type DailyTotals = DayTotal[]

/**
 * @description 年別の月合計の１月ずつの要素
 */
export type YearMonthlyTotal = { month: string; total: number }

/**
 * @description 年別の月合計（1〜12月）の配列
 */
export type YearMonthlyTotals = YearMonthlyTotal[]
