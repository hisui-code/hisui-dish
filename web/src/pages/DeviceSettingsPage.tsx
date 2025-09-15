import { useEffect, useState } from 'react'
import { getDeviceSetting, updateDeviceSetting, type DeviceSetting } from '../lib/api'

// デバイス設定ページ: 設定の取得・編集・保存を行う

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID!

export default function DeviceSettingsPage() {
  const [cur, setCur] = useState<DeviceSetting | null>(null) // 現在の設定
  const [stable, setStable] = useState<number>(60) // 安定判定秒数
  const [maxSess, setMaxSess] = useState<number>(300) // セッション最大秒数
  const [msg, setMsg] = useState('') // 成功/失敗メッセージ

  // マウント時に設定値を取得
  useEffect(() => {
    getDeviceSetting(DEVICE_ID)
      .then((d) => {
        setCur(d)
        setStable(d.stable_duration_sec)
        setMaxSess(d.max_session_sec)
      })
      .catch((e) => setMsg(`Load NG: ${String(e)}`))
  }, [])

  // 設定をAPIへ保存
  const onSave = async () => {
    if (!cur) return
    try {
      const next = await updateDeviceSetting(DEVICE_ID, {
        stable_duration_sec: Number(stable),
        max_session_sec: Number(maxSess),
        lock_version: cur.lock_version,
      })
      setCur(next)
      setMsg(`Saved. lock_version=${next.lock_version}`)
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setMsg(`Save NG: ${String(m)}`)
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Device Settings</h1>
      {!cur ? (
        <div>Loading</div>
      ) : (
        <>
          {/* 入力フォーム */}
          <label className="block">
            <span className="text-sm">stable_duration_sec</span>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="number"
              value={stable}
              onChange={(e) => setStable(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-sm">max_session_sec</span>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="number"
              value={maxSess}
              onChange={(e) => setMaxSess(Number(e.target.value))}
            />
          </label>

          {/* version と最終更新 */}
          <div className="text-xs text-gray-500">
            lock_version: {cur.lock_version} / updated_at:{' '}
            {new Date(cur.updated_at).toLocaleString()}
          </div>

          {/* APIへ反映 */}
          <button className="rounded bg-black text-white px-4 py-2" onClick={onSave}>
            保存
          </button>
        </>
      )}
      {/* 通知メッセージ */}
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  )
}
