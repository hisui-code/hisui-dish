// src/components/settings/SettingsFields.tsx
import Field from '@/components/ui/Field'
import NumberBox from '@/components/ui/NumberBox'
import { RANGES } from './logic'
import type { FormState } from './logic'

type Props = {
  values: FormState
  errors: Partial<Record<keyof FormState, string>>
  onChange: <K extends keyof FormState>(key: K, val: number) => void
}

export default function SettingsFields({ values, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Field
        label={`stable_duration_sec（${RANGES.stable.label}）`}
        help="安定とみなすための連続秒数"
        error={errors.stable}
        htmlFor="stable"
      >
        <NumberBox
          id="stable"
          value={values.stable}
          onChange={(n) => onChange('stable', n)}
          min={RANGES.stable.min}
          max={RANGES.stable.max}
          unit={RANGES.stable.unit}
        />
      </Field>

      <Field
        label={`max_session_sec（${RANGES.maxSess.label}）`}
        help="1回の計測セッションの上限"
        error={errors.maxSess}
        htmlFor="maxSess"
      >
        <NumberBox
          id="maxSess"
          value={values.maxSess}
          onChange={(n) => onChange('maxSess', n)}
          min={RANGES.maxSess.min}
          max={RANGES.maxSess.max}
          unit={RANGES.maxSess.unit}
        />
      </Field>

      <Field
        label={`tare_weight（${RANGES.tare.label}）`}
        help="正味重量=総重量-器"
        error={errors.tare}
        htmlFor="tare"
      >
        <NumberBox
          id="tare"
          value={values.tare}
          onChange={(n) => onChange('tare', n)}
          min={RANGES.tare.min}
          max={RANGES.tare.max}
          unit={RANGES.tare.unit}
        />
      </Field>

      <Field
        label={`stability_epsilon_g（${RANGES.eps.label}）`}
        help="この幅以内なら安定"
        error={errors.eps}
        htmlFor="eps"
      >
        <NumberBox
          id="eps"
          value={values.eps}
          onChange={(n) => onChange('eps', n)}
          min={RANGES.eps.min}
          max={RANGES.eps.max}
          unit={RANGES.eps.unit}
        />
      </Field>

      <Field
        label={`sampling_hz（${RANGES.hz.label}）`}
        help="1秒あたりの計測回数。大きすぎるとノイズ/負荷が増えます"
        error={errors.hz}
        htmlFor="hz"
      >
        <NumberBox
          id="hz"
          value={values.hz}
          onChange={(n) => onChange('hz', n)}
          min={RANGES.hz.min}
          max={RANGES.hz.max}
          unit={RANGES.hz.unit}
        />
      </Field>

      <Field
        label={`moving_avg_window（${RANGES.win.label}）`}
        help="移動平均に用いる直近サンプル数。ノイズ低減と応答性のトレードオフ"
        error={errors.win}
        htmlFor="win"
      >
        <NumberBox
          id="win"
          value={values.win}
          onChange={(n) => onChange('win', n)}
          min={RANGES.win.min}
          max={RANGES.win.max}
          unit={RANGES.win.unit}
        />
      </Field>

      <Field
        label={`gross_weight_limit_g（${RANGES.gross.label}）`}
        help="異常値ガード"
        error={errors.gross}
        htmlFor="gross"
      >
        <NumberBox
          id="gross"
          value={values.gross}
          onChange={(n) => onChange('gross', n)}
          min={RANGES.gross.min}
          max={RANGES.gross.max}
          unit={RANGES.gross.unit}
        />
      </Field>
    </div>
  )
}
