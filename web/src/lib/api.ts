// HisuiDish Webクライアント用 API クライアント
// Rails 側の REST API (/api/v1/...) と通信するための共通関数群

import type { DeviceSetting } from '../types/deviceSettings'

// APIのベースURLを環境変数から取得
const BASE = import.meta.env.VITE_API_BASE as string

// --- 共通関数群 -------------------------------------------------

// JSONパースを安全に行う
async function parseJsonSafely(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

// 共通のリクエスト関数
// 成功時はパース済みJSONを返し、エラー時は body.error または HTTPステータスを例外として投げる
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  const body = await parseJsonSafely(res)

  if (!res.ok) {
    // サーバーが返したエラー内容を優先
    const msg = (body && (body.error || body.message)) ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  return body as T
}

// --- API呼び出し関数 ---------------------------------------------

// HealthチェックAPI（Rails側の /api/v1/health）
export type Health = { status: string }
export function getHealth() {
  return req<Health>('/api/v1/health')
}

// GET: 指定デバイスの設定を取得
export function getDeviceSetting(deviceId: string) {
  return req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`)
}

// PUT: デバイス設定を更新（lock_version が必須 / 部分更新も可）
export function updateDeviceSetting(deviceId: string, params: Partial<DeviceSetting>) {
  return req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ device_setting: params }),
  })
}

// 型エクスポート
export type { DeviceSetting }
