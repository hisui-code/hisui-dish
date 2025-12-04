let authToken: string | null = null

// 現在のトークンを取得
export function getAuthToken(): string | null {
  return authToken
}

// トークンをセット＆localStorage に保存/削除
export function setAuthToken(token: string | null) {
  authToken = token

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
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem('authToken')
  authToken = stored ?? null
}
