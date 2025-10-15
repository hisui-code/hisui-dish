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
