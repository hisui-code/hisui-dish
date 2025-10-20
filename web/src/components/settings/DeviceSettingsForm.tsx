// web/src/components/settings/DeviceSettingsForm.tsx
import { useMemo, useState } from 'react'
import type { DeviceSetting } from '../../types/deviceSettings'
import { updateDeviceSetting } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import Field from '@/components/ui/Field'
import NumberBox from '@/components/ui/NumberBox'

type Props = {
  initial: DeviceSetting
  onReload: () => void // 保存後に再取得したい場合に呼ぶ（Settings 側で Suspense リロード）
}

export default function DeviceSettingsForm({ initial, onReload }: Props) {
  // 初期値をメモ化（比較やResetに使う）
  const base = useMemo(() => initial, [initial])

  // 入力ステート（まずは主要7項目）
  const [stable, setStable] = useState<number>(base.stable_duration_sec)
  const [maxSess, setMaxSess] = useState<number>(base.max_session_sec)
  const [tare, setTare] = useState<number>(base.tare_weight)
  const [eps, setEps] = useState<number>(base.stability_epsilon_g)
  const [hz, setHz] = useState<number>(base.sampling_hz)
  const [win, setWin] = useState<number>(base.moving_avg_window)
  const [gross, setGross] = useState<number>(base.gross_weight_limit_g)

  // メタ情報
  const [lockVersion, setLockVersion] = useState<number>(base.lock_version)
  const [updatedAt, setUpdatedAt] = useState<string>(base.updated_at)

  // UI 状態
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')

  // 変更有無
  const dirty =
    stable !== base.stable_duration_sec ||
    maxSess !== base.max_session_sec ||
    tare !== base.tare_weight ||
    eps !== base.stability_epsilon_g ||
    hz !== base.sampling_hz ||
    win !== base.moving_avg_window ||
    gross !== base.gross_weight_limit_g

  // サーバ想定の入力範囲（プレビュー準拠）
  const ranges = {
    stable: { min: 1, max: 300, unit: 'sec' },
    maxSess: { min: 1, max: 3600, unit: 'sec' },
    tare: { min: 1, max: 5000, unit: 'g' },
    eps: { min: 1, max: 200, unit: 'g' },
    hz: { min: 1, max: 200, unit: 'Hz' },
    win: { min: 1, max: 300, unit: 'N' },
    gross: { min: 1, max: 100000, unit: 'g' },
  } as const

  // バリデーション
  function validateAll(values?: {
    stable: number
    maxSess: number
    tare: number
    eps: number
    hz: number
    win: number
    gross: number
  }) {
    const v = values ?? { stable, maxSess, tare, eps, hz, win, gross }
    const errs: Partial<Record<keyof typeof v, string>> = {}
    ;(Object.keys(v) as (keyof typeof v)[]).forEach((k) => {
      const n = v[k]
      const { min, max } = ranges[k as keyof typeof ranges]
      if (!Number.isInteger(n) || n < min || n > max) {
        errs[k] = `${min}〜${max} の整数で入力してください`
      }
    })
    return errs
  }
  const errors = validateAll()
  const hasError = Object.keys(errors).length > 0

  function reset() {
    setStable(base.stable_duration_sec)
    setMaxSess(base.max_session_sec)
    setTare(base.tare_weight)
    setEps(base.stability_epsilon_g)
    setHz(base.sampling_hz)
    setWin(base.moving_avg_window)
    setGross(base.gross_weight_limit_g)
    setMsg('')
  }

  async function onSave() {
    setMsg('')
    const errs = validateAll()
    if (Object.keys(errs).length) {
      setMsg('入力値にエラーがあります')
      return
    }

    setSaving(true)
    try {
      // lock_version を渡して楽観ロック（サーバ仕様）
      const next = await updateDeviceSetting(base.device_id, {
        stable_duration_sec: stable,
        max_session_sec: maxSess,
        tare_weight: tare,
        stability_epsilon_g: eps,
        sampling_hz: hz,
        moving_avg_window: win,
        gross_weight_limit_g: gross,
        lock_version: lockVersion,
      })

      // サーバが返した最新状態で UI を更新
      setLockVersion(next.lock_version)
      setUpdatedAt(next.updated_at)
      setMsg('保存しました')

      // 画面全体の再取得が必要なら（Suspense リロード）
      onReload()
    } catch (e: unknown) {
      // 重大系のみ人間向けに整形
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
    <Card className="rounded-3xl border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-[15px] font-semibold tracking-tight">デバイス設定</CardTitle>
          <div className="text-xs text-neutral-500">Device ID: {base.device_id}</div>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <div>lock_version: {lockVersion}</div>
          <div>updated_at: {new Date(updatedAt).toLocaleString()}</div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field
          label="stable_duration_sec（安定判定の秒数）"
          help="安定とみなすための連続秒数"
          error={errors.stable}
          htmlFor="stable"
        >
          <NumberBox
            id="stable"
            value={stable}
            onChange={setStable}
            min={ranges.stable.min}
            max={ranges.stable.max}
            unit={ranges.stable.unit}
          />
        </Field>

        <Field
          label="max_session_sec（セッション最大秒数）"
          help="1回の計測セッションの上限"
          error={errors.maxSess}
          htmlFor="maxSess"
        >
          <NumberBox
            id="maxSess"
            value={maxSess}
            onChange={setMaxSess}
            min={ranges.maxSess.min}
            max={ranges.maxSess.max}
            unit={ranges.maxSess.unit}
          />
        </Field>

        <Field
          label="tare_weight（器の重さ）"
          help="正味重量=総重量-器"
          error={errors.tare}
          htmlFor="tare"
        >
          <NumberBox
            id="tare"
            value={tare}
            onChange={setTare}
            min={ranges.tare.min}
            max={ranges.tare.max}
            unit={ranges.tare.unit}
          />
        </Field>

        <Field
          label="stability_epsilon_g（許容変動）"
          help="この幅以内なら安定"
          error={errors.eps}
          htmlFor="eps"
        >
          <NumberBox
            id="eps"
            value={eps}
            onChange={setEps}
            min={ranges.eps.min}
            max={ranges.eps.max}
            unit={ranges.eps.unit}
          />
        </Field>

        <Field
          label="sampling_hz（サンプリング周波数）"
          help="高すぎるとノイズ/負荷"
          error={errors.hz}
          htmlFor="hz"
        >
          <NumberBox
            id="hz"
            value={hz}
            onChange={setHz}
            min={ranges.hz.min}
            max={ranges.hz.max}
            unit={ranges.hz.unit}
          />
        </Field>

        <Field
          label="moving_avg_window（移動平均の窓）"
          help="サンプル数（整数）"
          error={errors.win}
          htmlFor="win"
        >
          <NumberBox
            id="win"
            value={win}
            onChange={setWin}
            min={ranges.win.min}
            max={ranges.win.max}
            unit={ranges.win.unit}
          />
        </Field>

        <Field
          label="gross_weight_limit_g（総重量の上限）"
          help="異常値ガード"
          error={errors.gross}
          htmlFor="gross"
        >
          <NumberBox
            id="gross"
            value={gross}
            onChange={setGross}
            min={ranges.gross.min}
            max={ranges.gross.max}
            unit={ranges.gross.unit}
          />
        </Field>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-neutral-100">
        <div className="text-sm text-neutral-600">
          {msg ? (
            <span>{msg}</span>
          ) : hasError ? (
            <span className="text-rose-600">未入力/不正な値があります</span>
          ) : dirty ? (
            <span className="text-amber-600">未保存の変更があります</span>
          ) : (
            <span className="text-neutral-500">すべての値は範囲内の整数</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={reset}
            disabled={!dirty && !hasError}
          >
            Reset
          </Button>
          <Button
            className="rounded-full"
            onClick={onSave}
            disabled={hasError || (!dirty && !hasError) || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
