import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDashboardKpisToday } from '@/hooks/dashboard/useDashboardKpisToday'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'

vi.mock('@/hooks/dashboard/useDashboardData', () => ({
  useDashboardData: vi.fn(),
}))

describe('useDashboardKpisToday', () => {
  beforeEach(() => {
    // KPI/Today整形の入力データを固定する
    vi.mocked(useDashboardData).mockReturnValue({
      todayTotal: 120,
      bowlRemaining: 300,
      averageDailyIntakeLast3Months: 95,
      thisWeekTotalGrams: 700,
      thisMonthTotalGrams: 520,
      thisMonthDiffGrams: -34,
      thisMonthDiffPct: -0.061,
      todayEvents: [
        { time: '08:00', g: 40 },
        { time: '12:00', g: 80 },
      ],
      dailyTotals: [],
    } as never)
  })

  it('KPIとToday表示データを返す', () => {
    const { result } = renderHook(() => useDashboardKpisToday())

    // KPIは入力値をそのまま公開する
    expect(result.current.kpis.thisMonthTotalGrams).toBe(520)
    expect(result.current.kpis.thisMonthDiffGrams).toBe(-34)

    // Todayはイベント配列から集計して作る
    expect(result.current.today.count).toBe(2)
    expect(result.current.today.totalGrams).toBe(120)
    expect(result.current.today.hasEvents).toBe(true)
  })
})
