import { z } from 'zod'

// DeviceSettings フォーム用の Zod スキーマ
// - 文字列入力も z.coerce.number() で数値化
// - 正の整数（1以上）を強制
export const deviceSettingsSchema = z.object({
  stable: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  maxSess: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  tare: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  eps: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  hz: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  win: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
  gross: z.coerce.number().int().gt(0, '1以上の整数を入力してください'),
})

export type DeviceSettingsForm = z.infer<typeof deviceSettingsSchema>
