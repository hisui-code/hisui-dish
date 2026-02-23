// frontend/src/hooks/dashboard/__tests__/useDashboardPage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage'

import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import { useMonthlyDailyTotals } from '@/hooks/dashboard/useMonthlyDailyTotals'
import { useWeeklyTotalsMetrics } from '@/hooks/dashboard/useWeeklyTotals'
import { useYearMonthlyTotals } from '@/hooks/dashboard/useYearMonthlyTotals'

// useDashboardPage本体の整形ロジックだけを検証するため依存hookをモック化する
// API通信や各hookの実装差分の影響を除き、入力を固定して期待値を確認する
// NOTE: 1. vi.mock で依存hookを偽物にする
//       2. vi.mocked(useDashboardData).mockReturnValue(...) で返り値を固定する
//       3. renderHook(() => useDashboardPage()) で実行
//       4. expect(...) で整形結果を検証する

vi.mock('@/hooks/dashboard/useDashboardData', () => ({
  useDashboardData: vi.fn(),
}))
vi.mock('@/hooks/dashboard/useMonthlyDailyTotals', () => ({
  useMonthlyDailyTotals: vi.fn(),
}))
vi.mock('@/hooks/dashboard/useWeeklyTotals', () => ({
  useWeeklyTotalsMetrics: vi.fn(),
}))
vi.mock('@/hooks/dashboard/useYearMonthlyTotals', () => ({
  useYearMonthlyTotals: vi.fn(),
}))

describe('useDashboardPage', () => {
  beforeEach(() => {
    // 日付依存を固定して週ラベル計算を安定化する
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-18T12:00:00+09:00'))

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

    vi.mocked(useMonthlyDailyTotals).mockReturnValue([
      { day: '02/17', total: 100 },
      { day: '02/18', total: 120 },
    ] as never)

    vi.mocked(useWeeklyTotalsMetrics).mockReturnValue([
      { weekStartIso: '2026-01-12', totalGrams: 500, weekLabel: 'W00' },
      { weekStartIso: '2026-01-19', totalGrams: 650, weekLabel: 'W01' },
    ] as never)

    vi.mocked(useYearMonthlyTotals).mockReturnValue([
      { month: '01', total: 554 },
      { month: '02', total: 520 },
    ] as never)
  })

  it('today/kpis/seriesをViewModelへ集約する', () => {
    const { result } = renderHook(() => useDashboardPage())

    // 今日の集計値を正しく導出する
    expect(result.current.today.count).toBe(2)
    expect(result.current.today.totalGrams).toBe(120)
    expect(result.current.today.hasEvents).toBe(true)

    // KPI値をそのまま公開する
    expect(result.current.kpis.thisMonthTotalGrams).toBe(520)
    expect(result.current.kpis.thisMonthDiffGrams).toBe(-34)

    // 週次系列をグラフ用に整形する
    expect(result.current.weekly.series).toHaveLength(2)
    expect(result.current.weekly.series[0]).toHaveProperty('week')
    expect(result.current.weekly.series[0]).toHaveProperty('mondayMd')
    expect(result.current.weekly.series[0]).toHaveProperty('total')
  })

  it('weeklyの前後移動ハンドラがweekStartIsoを更新する', () => {
    const { result } = renderHook(() => useDashboardPage())

    const initial = result.current.weekly.weekStartIso

    // 過去移動で先頭週が変わる
    act(() => {
      result.current.weekly.onPrev()
    })
    const prevMoved = result.current.weekly.weekStartIso
    expect(prevMoved).not.toBe(initial)

    // 未来移動で先頭週が変わる
    act(() => {
      result.current.weekly.onNext()
    })
    const nextMoved = result.current.weekly.weekStartIso
    expect(nextMoved).not.toBe(prevMoved)
  })
})
