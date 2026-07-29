import { describe, expect, it } from 'vitest'
import { buildHealthLogSavePayload } from '@/lib/health-log/payload'
import type { HealthLogFormInput, HealthLogPhoto } from '@/types/healthLog'

const photo: HealthLogPhoto = {
  id: 'photo-1',
  disk: 'local',
  objectKey: 'users/1/tmp/photo-1.jpg',
  originalName: 'symptom.jpg',
  mimeType: 'image/jpeg',
  bytes: 1234,
  visibility: 'private',
  status: 'completed',
}

describe('buildHealthLogSavePayload', () => {
  it('フォーム入力から保存API用payloadを作る', () => {
    const form: HealthLogFormInput = {
      type: 'weight',
      occurredDate: '2026-06-20',
      occurredTime: '08:30',
      note: '  朝の体重  ',
      weightKg: '5.12',
      photos: [photo],
    }

    const payload = buildHealthLogSavePayload(form)

    // APIに渡す値はフォーム文字列から保存用の型へ整形する
    expect(payload).toEqual({
      type: 'weight',
      occurredAt: '2026-06-20T08:30:00',
      note: '朝の体重',
      weightKg: 5.12,
      photos: ['photo-1'],
    })
  })

  it('体重以外の記録では体重を含めず、空メモは送らない', () => {
    const form: HealthLogFormInput = {
      type: 'vomit',
      occurredDate: '2026-06-20',
      occurredTime: '21:10',
      note: '   ',
      weightKg: '5.12',
      photos: [],
    }

    const payload = buildHealthLogSavePayload(form)

    expect(payload).toEqual({
      type: 'vomit',
      occurredAt: '2026-06-20T21:10:00',
      note: undefined,
      weightKg: undefined,
      photos: [],
    })
  })
})
