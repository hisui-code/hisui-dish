import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchDeviceSettings } from './deviceSettings'

const BASE = 'http://localhost:3000'
const ID = 'dummy-device-id'

afterEach(() => {
  // 各テスト後にモックした関数をリセットする
  vi.restoreAllMocks()
})

// GETのテスト
describe('fetchDeviceSettings', () => {
  it('200 なら JSON を返す', async () => {
    const payload = {
      device_id: ID,
      stable_duration_sec: 3,
      max_session_sec: 600,
      lock_version: 0,
      tare_weight: 250,
      stability_epsilon_g: 5,
      sampling_hz: 10,
      moving_avg_window: 5,
      gross_weight_limit_g: 10_000,
      updated_at: '2025-01-01T00:00:00Z',
    }

    // 正常応答としてデバイス設定JSONを返すfetchをモック
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 })
    )

    // モックしたレスポンスがそのまま返却されることを検証
    const data = await fetchDeviceSettings(BASE, ID)
    expect(data.device_id).toBe(ID)
    expect(data.max_session_sec).toBe(600)
  })

  it('404 なら not_found を投げる', async () => {
    // 404とエラーメッセージを返すfetchをモック
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })
    )

    // エラーメッセージが例外として伝播することを確認
    await expect(fetchDeviceSettings(BASE, ID)).rejects.toThrow('not_found')
  })
})
