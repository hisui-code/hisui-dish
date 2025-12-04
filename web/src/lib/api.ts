// HisuiDish Webクライアント用 API クライアント
// Rails 側の REST API (/api/v1/...) と通信するための共通関数群

import type { DeviceSetting } from '../types/deviceSettings'

const BASE = import.meta.env.VITE_API_BASE as string

// --- 認証用トークン ------------------------------------
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

// --- JSONパース ------------------------------------
async function parseJsonSafely(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

// --- 共通関数群 -------------------------------------------------
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  // JSON ペイロードを送るため Content-Type をデフォルト指定する
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // 🔸 ログインしている場合は Authorization を自動で付与
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
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

// HealthチェックAPI
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
