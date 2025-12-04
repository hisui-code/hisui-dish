import { getAuthToken } from './auth'

const BASE = import.meta.env.VITE_API_BASE as string

async function parseJsonSafely(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`

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
    const msg = (body && (body.error || body.message)) ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  return body as T
}
