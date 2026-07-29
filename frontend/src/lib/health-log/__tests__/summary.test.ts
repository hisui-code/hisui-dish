import { describe, expect, it } from 'vitest'
import { buildHealthLogSummary } from '@/lib/health-log/summary'
import type { HealthLogRecord } from '@/types/healthLog'

describe('buildHealthLogSummary', () => {
  it('健康記録一覧から今月件数、最新通院日、最新体重を作る', () => {
    const logs: HealthLogRecord[] = [
      {
        id: 'weight-old',
        type: 'weight',
        occurredAt: '2026-06-01T09:00:00Z',
        weightKg: 4.8,
        photos: [],
      },
      {
        id: 'hospital-old',
        type: 'hospital_visit',
        occurredAt: '2026-06-05T09:00:00Z',
        photos: [],
      },
      {
        id: 'weight-new',
        type: 'weight',
        occurredAt: '2026-06-20T09:00:00Z',
        weightKg: 5.1,
        photos: [],
      },
      {
        id: 'hospital-new',
        type: 'hospital_visit',
        occurredAt: '2026-06-25T09:00:00Z',
        photos: [],
      },
    ]

    const summary = buildHealthLogSummary(logs)

    // 件数は渡された月の一覧件数をそのまま使う
    expect(summary.monthlyLogCount).toBe(4)

    // 通院と体重は種別ごとに最新日時の記録を使う
    expect(summary.latestHospitalVisitDate).toBe('2026年6月25日')
    expect(summary.latestWeightDate).toBe('2026年6月20日')
    expect(summary.latestWeightValue).toBe('5.1kg')
  })

  it('対象記録がない場合は未設定表示を返す', () => {
    const summary = buildHealthLogSummary([])

    expect(summary.monthlyLogCount).toBe(0)
    expect(summary.latestHospitalVisitDate).toBe('-')
    expect(summary.latestWeightDate).toBe('-')
    expect(summary.latestWeightValue).toBe('-')
  })
})
