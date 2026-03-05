import { getAuthToken, setAuthSession } from './auth'
import { API_BASE } from './config'

async function parseJsonSafely(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

// Web側から API を呼ぶときの共有HTTPクライアント
export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers = new Headers(init?.headers)

  // JSON ペイロードを送るため Content-Type をデフォルト指定する
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // 🔸 ログインしている場合は Authorization を自動で付与
  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...init,
    headers,
  })

  const body = await parseJsonSafely(res)

  if (!res.ok) {
    // サーバーが返したエラー内容を優先
    const errorFromBody = body?.error
    const messageFromBody = body?.message
    const fallbackMessage = `HTTP ${res.status}`
    const msg = errorFromBody ?? messageFromBody ?? fallbackMessage

    // セッション失効時は認証情報を即時クリアする
    if (res.status === 401 || msg === 'unauthorized') {
      setAuthSession(null, null)
    }
    throw new Error(msg)
  }

  return body as T
}
