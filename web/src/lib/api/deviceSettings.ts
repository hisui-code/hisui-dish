import { req } from './client'
import type { DeviceSetting } from '@/types/deviceSettings'

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
