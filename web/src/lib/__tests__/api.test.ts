import { describe, it, expect, vi, afterEach } from 'vitest'
import { getDeviceSetting, setAuthToken } from '../api/api'

// getDeviceSetting のリクエスト～レスポンスの流れを通して検証する統合的なテスト群

const ID = 'dummy-device-id'

afterEach(() => {
  // 各テスト後にモックを解除
  vi.restoreAllMocks()
  setAuthToken(null)
})

// GETのテスト
describe('fetchDeviceSettings', () => {
  it('200 なら JSON を返す', async () => {
    // 正常系で使うデバイス設定のダミーデータ
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

    // 正常応答としてデバイス設定を返す fetch をモック
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 })
    )
    // 認証
    setAuthToken('dummy-token')
    // 正常レスポンスがそのまま返ることを確認
    const data = await getDeviceSetting(ID)
    expect(data.device_id).toBe(ID)
    expect(data.max_session_sec).toBe(600)
  })

  it('404 なら not_found を投げる', async () => {
    // 404 応答とエラーメッセージを返す fetch をモック
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })
    )

    // エラーメッセージが例外として伝わることを確認
    await expect(getDeviceSetting(ID)).rejects.toThrow('not_found')
  })

  it('認証トークンがない場合 unauthorized を投げる', async () => {
    // 認証トークンなしの状態にする
    setAuthToken(null)

    // 401応答とエラーメッセージを返 fetchをモック
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    )
    await expect(getDeviceSetting(ID)).rejects.toThrow('unauthorized')
  })
})
