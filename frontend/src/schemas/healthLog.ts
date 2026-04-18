import { z } from 'zod'
import type { HealthLogFormInput, HealthLogType } from '@/types/healthLog'

/**
 * 健康記録フォームで選択可能な種別一覧
 * フォーム値と型定義の不整合を防ぐため、Zod の enum と `HealthLogType` を同期させる
 */
const healthLogTypeSchema = z.enum([
  'vomit',
  'diarrhea',
  'bloody_stool',
  'injury',
  'hospital_visit',
  'medication',
  'weight',
  'other',
] satisfies [HealthLogType, ...HealthLogType[]])

/**
 * 健康記録フォーム全体の入力ルール
 * 日付や時間などの共通項目に加えて、種別ごとに必要な追加検証もここでまとめて扱う
 */
const healthLogFormSchema = z
  .object({
    type: healthLogTypeSchema,
    occurredDate: z.string().min(1, '日付は必須です'),
    occurredTime: z.string().min(1, '時間は必須です'),
    note: z.string(),
    weightKg: z.string(),
  })
  .superRefine((data, ctx) => {
    // 体重以外の記録では入力欄を持っていても評価しない
    // 種別ごとの必須条件をここで分岐して、共通スキーマを保つ
    if (data.type !== 'weight') {
      return
    }

    // 未入力と数値不正で案内を分けるため、先に空文字を判定する
    if (data.weightKg.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: '体重は必須です',
        path: ['weightKg'],
      })
      return
    }

    const parsedWeightKg = Number(data.weightKg)

    // 数値に変換できない値は以降の大小比較が成立しないため、ここで弾く
    if (Number.isNaN(parsedWeightKg)) {
      ctx.addIssue({
        code: 'custom',
        message: '体重は数値で入力してください',
        path: ['weightKg'],
      })
    }

    // 0kg以下は無効な値
    if (parsedWeightKg <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: '体重は0より大きい数値を入力してください',
        path: ['weightKg'],
      })
    }
  })

/**
 * 健康記録フォームの入力値を検証する
 * Zod の検証結果を画面表示しやすい成功/失敗の形式に整えて返す
 *
 * @param form 検証対象フォーム
 * @returns 成功時は検証済み値 失敗時は表示用メッセージ
 */
export function validateHealthLogForm(
  form: HealthLogFormInput
): { success: true; data: HealthLogFormInput } | { success: false; message: string } {
  const result = healthLogFormSchema.safeParse(form)

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? '入力内容が不正です',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}
