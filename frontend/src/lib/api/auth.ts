import { API_BASE } from './config'

type LoginResponse = {
  auth_token: string
  body?: {
    user_id?: number
    name?: string | null
    email?: string
    role?: 'admin' | 'user' | 'guest'
  }
}

let authToken: string | null = null
let authUserId: number | null = null
let authUserName: string | null = null
let authRole: 'admin' | 'user' | 'guest' | null = null

/**
 * @description 現在の認証トークンを取得する
 * @returns 認証トークン。未設定ならnull
 */
export function getAuthToken(): string | null {
  return authToken
}

/**
 * @description 現在のログインユーザーIDを取得する
 * @returns ユーザーID 未設定ならnull
 */
export function getAuthUserId(): number | null {
  return authUserId
}

/**
 * @description 現在のログインユーザー名を取得する
 * @returns ユーザー名 未設定ならnull
 */
export function getAuthUserName(): string | null {
  return authUserName
}

/**
 * @description 現在のロールを取得する
 * @returns ロール 未設定ならnull
 */
export function getAuthRole(): 'admin' | 'user' | 'guest' | null {
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
  setAuthSession(token, authUserId, authUserName, authRole)
}

/**
 * @description 認証情報をメモリとlocalStorageへ同期する
 * @param token 認証トークン
 * @param userId ログインユーザーID
 * @param userName ログインユーザー名
 * @param role ユーザーロール
 * @returns void
 */
export function setAuthSession(
  token: string | null,
  userId: number | null = authUserId,
  userName: string | null = authUserName,
  role: 'admin' | 'user' | 'guest' | null
) {
  authToken = token
  authRole = role
  authUserId = userId
  authUserName = userName

  // ブラウザ以外の環境では永続化処理を行わない
  if (typeof window === 'undefined') return

  // リロード復元用にlocalStorageへ保存する
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')

  if (role) localStorage.setItem('auth_role', role)
  else localStorage.removeItem('auth_role')

  if (userId !== null) localStorage.setItem('auth_user_id', String(userId))
  else localStorage.removeItem('auth_user_id')

  if (userName) localStorage.setItem('auth_user_name', userName)
  else localStorage.removeItem('auth_user_name')
}

/**
 * @description localStorageから認証情報を復元してメモリへ反映する
 */
export function initAuthTokenFromStorage() {
  if (typeof window === 'undefined') return
  authToken = localStorage.getItem('auth_token')

  const storedUserId = localStorage.getItem('auth_user_id')
  authUserId = storedUserId ? Number(storedUserId) : null

  authUserName = localStorage.getItem('auth_user_name')

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
  const userId = body?.body?.user_id ?? null
  const userName = body?.body?.name ?? null
  const role = body?.body?.role ?? null

  if (!token) throw new Error('No token returned')

  // ログイン成功時は認証情報をまとめて同期
  setAuthSession(token, userId, userName, role)
  return body
}

// --- log out ---
export function logout() {
  // 認証情報を全消去して未ログイン状態に戻す
  setAuthSession(null, null, null, null)
}
