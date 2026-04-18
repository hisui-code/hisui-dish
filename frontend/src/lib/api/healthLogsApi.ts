import type { HealthLogSavePayload } from '@/types/healthLog'

/**
 * @description 健康記録を新規作成する
 */
export async function createHealthLog(payload: HealthLogSavePayload): Promise<void> {
  console.warn('createHealthLog is not implemented', payload)
}

/**
 * @description 健康記録を更新する
 */
export async function updateHealthLog(id: string, payload: HealthLogSavePayload): Promise<void> {
  console.warn('updateHealthLog is not implemented', id, payload)
}

/**
 * @description 健康記録を削除する
 */
export async function deleteHealthLog(id: string): Promise<void> {
  console.warn('deleteHealthLog is not implemented', id)
}
