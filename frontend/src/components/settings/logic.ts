import type { DeviceSetting } from '@/types/deviceSettings'

export type FormState = {
  stable: number
  maxSess: number
  tare: number
  eps: number
  hz: number
  win: number
  gross: number
}

export const RANGES = {
  stable: { min: 1, max: 300, unit: 'sec', label: '安定判定の秒数' },
  maxSess: { min: 1, max: 3600, unit: 'sec', label: 'セッション最大秒数' },
  tare: { min: 1, max: 5000, unit: 'g', label: '器の重さ' },
  eps: { min: 0.01, max: 5, unit: 'g', label: '許容変動' },
  hz: { min: 1, max: 200, unit: 'Hz', label: 'サンプリング頻度' },
  win: { min: 1, max: 300, unit: '個', label: '平均化サンプル数' },
  gross: { min: 1, max: 100000, unit: 'g', label: '総重量の上限' },
} as const

export function toFormState(initial: DeviceSetting): FormState {
  return {
    stable: initial.stable_duration_sec,
    maxSess: initial.max_session_sec,
    tare: initial.tare_weight,
    eps: initial.stability_epsilon_g,
    hz: initial.sampling_hz,
    win: initial.moving_avg_window,
    gross: initial.gross_weight_limit_g,
  }
}

export function isDirty(f: FormState, base: DeviceSetting): boolean {
  return (
    f.stable !== base.stable_duration_sec ||
    f.maxSess !== base.max_session_sec ||
    f.tare !== base.tare_weight ||
    f.eps !== base.stability_epsilon_g ||
    f.hz !== base.sampling_hz ||
    f.win !== base.moving_avg_window ||
    f.gross !== base.gross_weight_limit_g
  )
}

export function validate(f: FormState) {
  const errs: Partial<Record<keyof FormState, string>> = {}
  ;(Object.keys(f) as (keyof FormState)[]).forEach((k) => {
    const v = f[k]
    const { min, max } = RANGES[k]
    if (k === 'eps') {
      if (!Number.isFinite(v) || v < min || v > max) {
        errs[k] = `${RANGES[k].label}: ${min}〜${max} の数値で入力してください`
      }
      return
    }

    if (!Number.isInteger(v) || v < min || v > max) {
      errs[k] = `${RANGES[k].label}: ${min}〜${max} の整数で入力してください`
    }
  })
  return errs
}
