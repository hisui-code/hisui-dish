import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { useMonthTotalMetrics } from '@/hooks/dashboard/useMonthTotal'
import { useTodayVsPrevWeekMetrics } from '@/hooks/dashboard/useTodayVsPrevWeek'
import { fetchDailyTotals } from '@/lib/api/dashboardApi'
import { queryKeys } from '@/lib/queryKeys'

vi.mock('@tanstack/react-query', () => ({
  useSuspenseQuery: vi.fn(),
  useSuspenseQueries: vi.fn(),
}))

vi.mock('@/lib/api/dashboardApi', () => ({
  fetchDailyTotals: vi.fn(),
}))

describe('dashboard daily totals hooks', () => {
  beforeEach(() => {
    // 各テストでモック状態を初期化する
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    // 日付依存の副作用を次テストへ持ち越さない
    vi.useRealTimers()
  })

  it('useMonthTotalMetrics は dailyTotals を合計して返す', () => {
    // 月合計の計算入力を固定する
    vi.mocked(useSuspenseQuery).mockReturnValue({
      data: [
        { day: 1, total: 120 },
        { day: 2, total: '30' },
        { day: 3, total: 50 },
      ],
    } as never)

    const { result } = renderHook(() => useMonthTotalMetrics('2026-03'))

    // 合計が正しく計算されることを確認する
    expect(result.current.month).toBe('2026-03')
    expect(result.current.monthTotalGrams).toBe(200)

    // クエリキーが dailyTotals 系で統一されていることを確認する
    expect(useSuspenseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.dailyTotals('2026-03'),
      })
    )
  })

  it('useTodayVsPrevWeekMetrics は月またぎ週でも日別合計から比較値を作る', () => {
    // 今日を 2026-03-03 に固定して前週が 2月を含む状態を作る
    vi.setSystemTime(new Date('2026-03-03T10:00:00+09:00'))
    vi.mocked(fetchDailyTotals).mockResolvedValue([])

    vi.mocked(useSuspenseQueries).mockImplementation((params: never) => {
      const { queries } = params as {
        queries: Array<{
          queryKey: readonly string[]
          queryFn: () => Promise<unknown>
        }>
      }

      // 実際のqueryFnを呼び出して取得APIの呼び先を検証可能にする
      for (const q of queries) {
        void q.queryFn()
      }

      // months は ['2026-03', '2026-02'] の順で渡される
      return [
        {
          // 3/1 と 3/3 を用意する
          data: [
            { day: 1, total: 50 },
            { day: 3, total: 70 },
          ],
        },
        {
          // 前週 2/23-2/28 を用意する
          data: [
            { day: 23, total: 10 },
            { day: 24, total: 20 },
            { day: 25, total: 30 },
            { day: 28, total: 40 },
          ],
        },
      ] as never
    })

    const { result } = renderHook(() => useTodayVsPrevWeekMetrics())

    // 取得元が dailyTotals API であることを確認する
    expect(fetchDailyTotals).toHaveBeenCalledWith('2026-03')
    expect(fetchDailyTotals).toHaveBeenCalledWith('2026-02')
    expect(fetchDailyTotals).toHaveBeenCalledTimes(2)

    // 今日合計と前週平均の比較値が計算できることを確認する
    // 前週合計: 10+20+30+0+0+40+50 = 150
    // 前週平均: 150 / 7
    expect(result.current.todayIso).toBe('2026-03-03')
    expect(result.current.todayTotalGrams).toBe(70)
    expect(result.current.prevWeekStartIso).toBe('2026-02-23')
    expect(result.current.prevWeekEndIso).toBe('2026-03-01')
    expect(result.current.prevWeekAvgPerDayGrams).toBeCloseTo(150 / 7, 10)
  })

  it('useTodayVsPrevWeekMetrics は同月内の週では1ヶ月分だけ取得する', () => {
    // 今日を 2026-03-10 に固定して前週が同月内に収まる状態を作る
    vi.setSystemTime(new Date('2026-03-10T10:00:00+09:00'))
    vi.mocked(fetchDailyTotals).mockResolvedValue([])

    vi.mocked(useSuspenseQueries).mockImplementation((params: never) => {
      const { queries } = params as {
        queries: Array<{
          queryKey: readonly string[]
          queryFn: () => Promise<unknown>
        }>
      }

      // 呼び出し対象の月数をその場で検証する
      expect(queries).toHaveLength(1)
      expect(queries[0].queryKey).toEqual(queryKeys.dailyTotals('2026-03'))

      // 取得元が dailyTotals API かどうかを検証するために呼び出す
      void queries[0].queryFn()

      return [
        {
          // 今日の 3/10 のみ用意する
          data: [{ day: 10, total: 90 }],
        },
      ] as never
    })

    const { result } = renderHook(() => useTodayVsPrevWeekMetrics())

    // 同月ケースは 1回だけ取得されることを確認する
    expect(fetchDailyTotals).toHaveBeenCalledWith('2026-03')
    expect(fetchDailyTotals).toHaveBeenCalledTimes(1)
    expect(result.current.todayIso).toBe('2026-03-10')
    expect(result.current.todayTotalGrams).toBe(90)
  })
})
