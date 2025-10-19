import { useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { updateDeviceSetting } from '../../lib/api'
import type { DeviceSetting } from '../../types/deviceSettings'
import Field from '../ui/Field'
import NumberBox from '../ui/NumberBox'
import { zodResolver } from '@hookform/resolvers/zod'
import { deviceSettingsSchema } from '../../schemas/deviceSettings'
import { z } from 'zod'

type FormOutput = z.output<typeof deviceSettingsSchema> // Zodが返す型（coerce後＝number）
const rhfResolver: Resolver<FormOutput> = zodResolver(
  deviceSettingsSchema
) as unknown as Resolver<FormOutput>

export default function DeviceSettingsForm({
  initial,
  onReload,
}: {
  initial: DeviceSetting
  onReload: () => void
}) {
  // 画面下部のメッセージのみローカルstateで管理
  const [msg, setMsg] = useState('')

  // React Hook Form セットアップ
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormOutput>({
    // NOTE: zodResolver は input(unknown) -> output(number) を扱う実装のため、
    // RHF の型パラメータと厳密には一致しません。ここでは実装に沿って resolver を明示キャストします。
    resolver: rhfResolver,
    defaultValues: {
      stable: initial.stable_duration_sec,
      maxSess: initial.max_session_sec,
      tare: initial.tare_weight,
      eps: initial.stability_epsilon_g,
      hz: initial.sampling_hz,
      win: initial.moving_avg_window,
      gross: initial.gross_weight_limit_g,
    },
    mode: 'onChange',
  })

  // 保存処理（submit）
  const onSubmit = async (values: FormOutput) => {
    setMsg('')
    try {
      const next = await updateDeviceSetting(initial.device_id, {
        stable_duration_sec: values.stable,
        max_session_sec: values.maxSess,
        tare_weight: values.tare,
        stability_epsilon_g: values.eps,
        sampling_hz: values.hz,
        moving_avg_window: values.win,
        gross_weight_limit_g: values.gross,
        lock_version: initial.lock_version, // 楽観ロック（必要であれば hidden で持たせる）
      })
      setMsg(`保存しました（lock_version=${next.lock_version}）`)
      // 必要に応じてサーバ値で再同期
      // onReload()
    } catch (e) {
      const m = (e as Error).message
      setMsg(
        m === 'conflict'
          ? '他の画面で更新されました。再読込してください。'
          : m === 'unprocessable_content'
            ? '入力値が不正です。'
            : m === 'not_found'
              ? '設定が存在しません。'
              : `保存エラー: ${m}`
      )
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Field label="stable_duration_sec（安定判定までの秒数）" error={errors.stable?.message}>
        <Controller
          name="stable"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field label="max_session_sec（1セッションの最大計測時間）" error={errors.maxSess?.message}>
        <Controller
          name="maxSess"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field label="tare_weight（器の重さ[g]）" error={errors.tare?.message}>
        <Controller
          name="tare"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field label="stability_epsilon_g（安定とみなす変化量[g]）" error={errors.eps?.message}>
        <Controller
          name="eps"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field
        label="sampling_hz（計測の頻度[Hz] / 1秒あたりのサンプル数）"
        error={errors.hz?.message}
      >
        <Controller
          name="hz"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field
        label="moving_avg_window（計測の平均化範囲 / ノイズ除去の強さ）"
        error={errors.win?.message}
      >
        <Controller
          name="win"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <Field label="gross_weight_limit_g（最大測定重量[g]）" error={errors.gross?.message}>
        <Controller
          name="gross"
          control={control}
          render={({ field: { value, onChange } }) => (
            <NumberBox value={value} onChange={onChange} />
          )}
        />
      </Field>

      <div className="text-xs text-gray-500">lock_version: {initial.lock_version}</div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
        <button type="button" className="rounded border px-3 py-2" onClick={onReload}>
          再読込
        </button>
      </div>

      {msg && <div className="text-sm">{msg}</div>}
    </form>
  )
}
