export type DeviceSetting = {
  device_id: string
  stable_duration_sec: number
  max_session_sec: number
  lock_version: number
  tare_weight: number
  stability_epsilon_g: number
  sampling_hz: number
  moving_avg_window: number
  gross_weight_limit_g: number
  updated_at: string
}

// 指定デバイスの設定をAPIから取得し、失敗時はエラーメッセージ付きで例外を投げる
export async function fetchDeviceSettings(
  baseUrl: string,
  deviceId: string
): Promise<DeviceSetting> {
  const res = await fetch(`${baseUrl}/api/v1/device_settings/${deviceId}`)
  let body = null
  try {
    body = await res.json()
  } catch {
    // JSONが空の場合はbodyをnullのままにしてステータスで判定する
  }
  if (!res.ok) {
    const msg = body?.error ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return body as DeviceSetting
}
