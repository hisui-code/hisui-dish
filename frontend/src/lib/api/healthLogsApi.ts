import { req } from '@/lib/api/client'
import { resolveDeviceId } from '@/lib/api/config'
import type { HealthLogRecord, HealthLogSavePayload } from '@/types/healthLog'

type HealthLogApiPayload = {
  /** 端末ID */
  device_id: string
  /** 健康記録種別 */
  type: HealthLogSavePayload['type']
  /** 発生日時 */
  occurred_at: string
  /** メモ */
  note?: string
  /** 体重 */
  weight_kg?: number
  /** 写真識別子一覧 */
  photos: string[]
}

const buildHealthLogApiPayload = (payload: HealthLogSavePayload): HealthLogApiPayload => ({
  device_id: resolveDeviceId(),
  type: payload.type,
  occurred_at: payload.occurredAt,
  note: payload.note,
  weight_kg: payload.weightKg,
  photos: payload.photos,
})

/**
 * @description 健康記録を新規作成する
 */
export async function createHealthLog(payload: HealthLogSavePayload): Promise<HealthLogRecord> {
  const res = await req<{ healthLog: HealthLogRecord }>('/api/v1/health_logs', {
    method: 'POST',
    body: JSON.stringify(buildHealthLogApiPayload(payload)),
  })

  return res.healthLog
}

/**
 * @description 健康記録を更新する
 */
export async function updateHealthLog(
  id: string,
  payload: HealthLogSavePayload
): Promise<HealthLogRecord> {
  const res = await req<{ healthLog: HealthLogRecord }>(`/api/v1/health_logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(buildHealthLogApiPayload(payload)),
  })

  return res.healthLog
}

/**
 * @description 健康記録を削除する
 */
export async function deleteHealthLog(id: string): Promise<void> {
  const searchParams = new URLSearchParams({
    device_id: resolveDeviceId(),
  })

  await req(`/api/v1/health_logs/${id}?${searchParams.toString()}`, {
    method: 'DELETE',
  })
}
