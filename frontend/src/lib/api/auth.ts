import { API_BASE } from './config'

type Role = 'admin' | 'user' | 'guest'

type AuthSession = {
  token: string | null
  role: Role | null
}

type LoginResponse = {
  auth_token: string
  body?: {
    role?: Role
  }
}

// 認証状態変更をアプリ全体へ通知するためのイベント名
const AUTH_SESSION_CHANGED_EVENT = 'auth:session-changed'

let authToken: string | null = null
let authRole: Role | null = null

// 認証セッションを更新したことをアプリ全体へ通知する
// AuthContext がこのイベントを購読して loggedIn / authToken を同期する
const notifyAuthSessionChanged = (payload: AuthSession) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<AuthSession>(AUTH_SESSION_CHANGED_EVENT, { detail: payload })
  )
}

/**
 * @description 認証セッション変更通知を購読する
 * @param handler 認証情報が変わったときに呼ぶ処理
 * @returns 購読解除関数
 */
export function onAuthSessionChanged(handle: (payload: AuthSession) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  // CustomEventから認証セッションを取り出して購読側へ渡す
  const listener: EventListener = (event) => {
    const customEvent = event as CustomEvent<AuthSession>
    handle(customEvent.detail)
  }

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, listener)
  return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, listener)
}

/**
 * @description 現在の認証トークンを取得する
 * @returns 認証トークン。未設定ならnull
 */
export function getAuthToken(): string | null {
  return authToken
}

/**
 * @description 現在のロールを取得する
 * @returns ロール 未設定ならnull
 */
export function getAuthRole(): Role | null {
  // サイドバー表示制御に使う現在ロールを返す
  return authRole
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
 * @description 認証情報をメモリとlocalStorageへ同期する
 * @param token 認証トークン
 * @param role ユーザーロール
 * @returns void
 */
export function setAuthSession(token: string | null, role: 'admin' | 'user' | 'guest' | null) {
  authToken = token
  authRole = role

  // ブラウザ以外の環境では永続化処理を行わない
  if (typeof window === 'undefined') return

  // リロード復元用にlocalStorageへ保存する
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')

  if (role) localStorage.setItem('auth_role', role)
  else localStorage.removeItem('auth_role')

  notifyAuthSessionChanged({ token, role })
}

/**
 * @description localStorageから認証情報を復元してメモリへ反映する
 */
export function initAuthTokenFromStorage() {
  if (typeof window === 'undefined') return
  authToken = localStorage.getItem('auth_token')

  const storedRole = localStorage.getItem('auth_role')
  authRole =
    storedRole === 'admin' || storedRole === 'user' || storedRole === 'guest' ? storedRole : null
}

/**
 * @description メールとパスワードでログインし認証情報を保存する
 * @param email ログインメールアドレス
 * @param password ログインパスワード
 * @returns ログインAPIレスポンス
 */
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

  // ログイン成功時は認証情報をまとめて同期
  setAuthSession(token, role)
  return body
}

// --- log out ---
/**
 * @description サーバー側トークン失効を試行し、ローカル認証情報を破棄する
 */
export async function logout(): Promise<void> {
  const token = authToken

  setAuthSession(null, null)

  if (!token) return

  try {
    await fetch(`${API_BASE}/api/v1/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    // 通信失敗時もローカルログアウト状態は維持する
  }
}
