import { jst } from '@/lib/date'
import type { HealthLogFormInput, HealthLogSavePayload } from '@/types/healthLog'

/**
 * @description 健康記録フォームの入力値から保存用 payload を組み立てる
 * フォーム上の文字列を API 保存向けの型へ整形する
 */
export function buildHealthLogSavePayload(form: HealthLogFormInput): HealthLogSavePayload {
  const occurredAt = jst(`${form.occurredDate} ${form.occurredTime}`).format('YYYY-MM-DDTHH:mm:ss')
  const trimmedNote = form.note.trim()
  const parsedWeightKg = form.type === 'weight' && form.weightKg ? Number(form.weightKg) : undefined

  return {
    type: form.type,
    occurredAt,
    note: trimmedNote || undefined,
    weightKg: parsedWeightKg,
    photos: form.photos,
  }
}
