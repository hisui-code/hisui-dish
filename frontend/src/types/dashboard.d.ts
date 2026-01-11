export type TodayEvent = { time: string; g: number }
export type DayTotal = { day: string; total: number }

export type DashboardData = {
  todayEvents: TodayEvent[]
  dailySeries: DayTotal[]
  // 今日1日の合計摂取量（g）
  todayTotal: number
  // ボウルに残っているごはんの量（g）
  bowlRemaining: number
  // 過去最大3ヶ月分を対象にした1日あたりの平均摂取量（g/日）
  averageDailyIntakeLast3Months: number
}
