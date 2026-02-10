import { API_BASE } from './config'

type LoginResponse = {
  auth_token: string
  body?: {
    email?: string
    role?: 'admin' | 'user' | 'guest'
  }
}

let authToken: string | null = null
let authRole: 'admin' | 'user' | 'guest' | null = null

/**
 * @description 現在の認証トークンを取得する
 * @returns 認証トークン。未設定ならnull
 */
export function getAuthToken(): string | null {
  // モジュール内で保持している最新トークンを返す
  return authToken
}

/**
 * @description 現在のroleを維持したまま認証トークンを更新する
 * @param token 認証トークン
 * @returns void
 */
export function setAuthToken(token: string | null) {
  // roleは保持したままトークンだけ差し替える
  setAuthSession(token, authRole)
}

/**
 * @description 現在のロールを取得する
 * @returns ロール。未設定ならnull
 */
export function getAuthRole(): 'admin' | 'user' | 'guest' | null {
  // サイドバー表示制御に使う現在ロールを返す
  return authRole
}

/**
 * @description 認証トークンとロールを保存する
 * @param token 認証トークン
 * @param role ユーザーロール
 * @returns void
 */
export function setAuthSession(token: string | null, role: 'admin' | 'user' | 'guest' | null) {
  // メモリ上の認証状態を更新する
  authToken = token
  authRole = role

  // ブラウザ以外の環境では永続化処理を行わない
  if (typeof window === 'undefined') return

  // リロード後も認証状態を復元できるようにlocalStorageへ保存する
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')

  // サイドバー表示制御で使うためroleも同様に保存する
  if (role) localStorage.setItem('auth_role', role)
  else localStorage.removeItem('auth_role')
}

export function initAuthTokenFromStorage() {
  if (typeof window === 'undefined') return
  // 永続化済みの認証情報をメモリへ復元する
  authToken = localStorage.getItem('auth_token')
  const storedRole = localStorage.getItem('auth_role')
  // 想定外の値が保存されていた場合はnullに正規化する
  authRole =
    storedRole === 'admin' || storedRole === 'user' || storedRole === 'guest' ? storedRole : null
}

// --- log in ---
export async function login(email: string, password: string) {
  // ログインAPIに資格情報を送信する
  const res = await fetch(`${API_BASE}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  // エラーレスポンスでも本文があれば後続のエラーメッセージに利用する
  const body = (await res.json().catch(() => null)) as LoginResponse | null

  // API仕様のerrorコードを上位へ渡して画面側で分岐しやすくする
  if (!res.ok) throw new Error(body && 'error' in body ? String(body.error) : 'Login failed')

  const token = body?.auth_token
  const role = body?.body?.role ?? null
  if (!token) throw new Error('No token returned')

  // API応答を認証状態として保持する
  setAuthSession(token, role)
  return body
}

// --- log out ---
export function logout() {
  // 認証情報を全消去して未ログイン状態に戻す
  setAuthSession(null, null)
}
