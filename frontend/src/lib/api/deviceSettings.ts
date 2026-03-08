import { req } from './client'
import type { DeviceSetting } from '@/types/deviceSettings'

// GET: 指定デバイスの設定を取得
export function getDeviceSetting(deviceId: string) {
  return req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`)
}

// PUT: デバイス設定を更新する
// 現在は device_setting 配下に必要項目をすべて渡す前提
export function updateDeviceSetting(deviceId: string, params: Partial<DeviceSetting>) {
  return req<DeviceSetting>(`/api/v1/device_settings/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ device_setting: params }),
  })
}

// 型エクスポート
export type { DeviceSetting }
