// src/components/settings/DeviceSettingsForm.tsx
import { useMemo, useState } from 'react'
import type { DeviceSetting } from '@/types/deviceSettings'
import { updateDeviceSetting } from '@/lib/api'
import SettingsHeader from './SettingsHeader'
import SettingsFields from './SettingsFields'
import StatusLine from './StatusLine'
import ActionButtons from './ActionButtons'
import { toFormState, validate, isDirty, type FormState } from './logic'

type Props = {
  initial: DeviceSetting
  onReload: () => void
}

export default function DeviceSettingsForm({ initial, onReload }: Props) {
  const base = useMemo(() => initial, [initial])

  // 入力値
  const [f, setF] = useState<FormState>(() => toFormState(base))
  const setField = <K extends keyof FormState>(k: K, val: number) =>
    setF((prev) => ({ ...prev, [k]: val }))

  // メタ & UI
  const [lockVersion, setLockVersion] = useState<number>(base.lock_version)
  const [updatedAt, setUpdatedAt] = useState<string>(base.updated_at)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const errors = validate(f)
  const hasError = Object.keys(errors).length > 0
  const dirty = isDirty(f, base)

  const onReset = () => {
    setF(toFormState(base))
    setMsg('')
  }

  const onSave = async () => {
    setMsg('')
    if (hasError) {
      setMsg('入力値にエラーがあります')
      return
    }
    setSaving(true)
    try {
      const next = await updateDeviceSetting(base.device_id, {
        stable_duration_sec: f.stable,
        max_session_sec: f.maxSess,
        tare_weight: f.tare,
        stability_epsilon_g: f.eps,
        sampling_hz: f.hz,
        moving_avg_window: f.win,
        gross_weight_limit_g: f.gross,
        lock_version: lockVersion,
      })
      setLockVersion(next.lock_version)
      setUpdatedAt(next.updated_at)
      setMsg('保存しました')
      onReload()
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      const human =
        m === 'not_found'
          ? '設定が存在しません（404）'
          : m === 'conflict'
            ? '他の画面で更新されました（409）。再読込してやり直してください。'
            : m === 'unprocessable_content'
              ? '入力値が不正です（422）。'
              : `保存エラー: ${m}`
      setMsg(human)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHeader deviceId={base.device_id} lockVersion={lockVersion} updatedAt={updatedAt} />

      <SettingsFields values={f} errors={errors} onChange={setField} />

      <div className="flex items-center justify-between gap-3">
        <StatusLine msg={msg} hasError={hasError} dirty={dirty} />
        <ActionButtons
          onReset={onReset}
          onSave={onSave}
          disabledReset={!dirty && !hasError}
          disabledSave={hasError || (!dirty && !hasError) || saving}
          saving={saving}
        />
      </div>
    </div>
  )
}
