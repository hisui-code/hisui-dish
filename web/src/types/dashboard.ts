export type TodayEvent = { time: string; g: number }
export type DayTotal = { day: string; total: number }

export type DashboardData = {
  todayEvents: TodayEvent[]
  dailySeries: DayTotal[]
  todayTotal: number
  bowlRemaining: number
}
