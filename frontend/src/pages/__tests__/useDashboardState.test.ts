import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardState } from '@/hooks/dashboard/useDashboardState'

describe('useDashboardState', () => {
  beforeEach(() => {
    // 日付依存の初期値を固定する
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-18T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('月/週/年のカーソル状態を返す', () => {
    const { result } = renderHook(() => useDashboardState())

    // 初期カーソルが期待どおりに設定される
    expect(result.current.monthly.month).toBe('2026-02')
    expect(result.current.yearMonthly.year).toBe('2026')
    expect(result.current.weekly.weekStartIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.current.weekly.rangeLabel).toContain('の週')
  })

  it('週移動ハンドラでweekStartIsoが更新される', () => {
    const { result } = renderHook(() => useDashboardState())
    const initial = result.current.weekly.weekStartIso

    // 過去へ移動する
    act(() => {
      result.current.weekly.onPrev()
    })
    const prevMoved = result.current.weekly.weekStartIso
    expect(prevMoved).not.toBe(initial)

    // 未来へ戻す
    act(() => {
      result.current.weekly.onNext()
    })
    const nextMoved = result.current.weekly.weekStartIso
    expect(nextMoved).not.toBe(prevMoved)
  })
})
