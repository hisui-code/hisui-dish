import { API_BASE } from './config'

let authToken: string | null = null

// 現在のトークンを取得
export function getAuthToken(): string | null {
  return authToken
}

// トークンをセット＆localStorage に保存/削除
export function setAuthToken(token: string | null) {
  authToken = token

  // ブラウザ以外（テスト・SSRなど）では localStorage を触らない
  if (typeof window === 'undefined') return

  if (token) {
    // ログイン成功時に保存
    localStorage.setItem('auth_token', token)
  } else {
    // ログアウト時に削除
    localStorage.removeItem('auth_token')
  }
}

// 初期表示時に localStorage からトークンを読み込む
export function initAuthTokenFromStorage() {
  // ブラウザ以外（テスト・SSRなど）では localStorage を触らない
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem('auth_token')
  authToken = stored ?? null
}

// --- log in ---
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  //レスポンスがjsonでなければnull
  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.error ?? 'Login failed')
  }

  const token = body.auth_token
  if (!token) throw new Error('No token returned')

  setAuthToken(token)
  return body
}

// --- log out ---
export default function logout() {
  setAuthToken(null)
}
