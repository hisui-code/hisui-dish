/**
 * @description
 * フロントエンドの環境変数（Vite）をまとめて扱う設定。
 * `import.meta.env` はビルド時に埋め込まれるため、参照はここに集約する。
 */

/**
 * @description API のベースURL
 */
export const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? ''

/**
 * @description DEVICE_ID（UUID）
 * `VITE_DEVICE_ID` が未設定だと実行時にエラーにする
 */
export const DEVICE_ID = (() => {
  const raw = (import.meta.env.VITE_DEVICE_ID as string) ?? ''
  return requireEnv('VITE_DEVICE_ID', raw)
})()

/**
 * @description
 * 必須の環境変数が未設定の場合にエラーにする。
 * 実行時に気づけるように、読み取り時点でチェックする。
 *
 * @param name - 環境変数名
 * @param value - 環境変数の値
 * @returns value（未設定なら例外）
 */
function requireEnv(name: string, value: string): string {
  // 空文字や未設定を弾く
  if (!value || value.trim() === '') {
    throw new Error(`${name} is not set`)
  }
  return value
}

/**
 * @description
 * DEVICE_ID を解決するヘルパー関数。
 * 環境変数が未設定の場合はエラーを投げる。
 *
 * @returns deviceId
 */
export function resolveDeviceId(): string {
  return DEVICE_ID
}
