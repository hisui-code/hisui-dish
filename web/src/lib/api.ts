const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path}: ${res.status} `)
  return res.json() as Promise<T>
}

export type Health = { status: string }

export const getHealth = () => req<Health>('/api/v1/health')

export type DeviceSetting = {
  device_id: string
  stable_duration_sec: number
  max_session_sec: number
  lock_version: number
  updated_at: string
}

// 重量センサーの設定値を取得
export const getDeviceSetting = (deviceId: string) =>
  req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`)

// 重量センサーの設定値を更新
export const updateDeviceSetting = (
  deviceId: string,
  body: Pick<DeviceSetting, 'stable_duration_sec' | 'max_session_sec' | 'lock_version'>
) =>
  req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ device_setting: body }),
  })
