import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  login,
  logout,
  getAuthToken,
  getAuthRole,
  setAuthToken,
  setAuthSession,
  initAuthTokenFromStorage,
  onAuthSessionChanged,
} from '../api/auth'
import { API_BASE } from '../api/config'

const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: string) {
      store[key] = value
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('auth login / logout', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    setAuthToken(null)
    // Node環境では window がないので、localStorage ガードを通すためにダミーを置く
    globalThis.window = globalThis.window ?? {}
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('login 成功時: /login にPOSTし、トークンを保持する', async () => {
    const mockResponse = {
      auth_token: 'test-token-123',
      body: { email: 'user@example.com' },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response)

    globalThis.fetch = fetchMock

    await login('user@example.com', 'password123')

    // 呼び出し内容チェック
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/api/v1/login`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
        }),
      })
    )
    // トークン保存チェック
    expect(getAuthToken()).toBe('test-token-123')
    expect(localStorage.getItem('auth_token')).toBe('test-token-123')
  })

  it('login 失敗時: invalid_credentials を投げる', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_credentials' }),
    } as Response)
    globalThis.fetch = fetchMock

    await expect(login('user@example.com', 'wrong-password')).rejects.toThrow('invalid_credentials')

    // トークンはセットされない
    expect(getAuthToken()).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('logout: トークンと localStorage をクリアする', () => {
    setAuthToken('abc123')
    expect(getAuthToken()).toBe('abc123')
    logout()

    expect(getAuthToken()).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('initAuthTokenFromStorage: localStorage から復元する', () => {
    localStorage.setItem('auth_token', 'stored-token')
    initAuthTokenFromStorage()

    expect(getAuthToken()).toBe('stored-token')
  })

  it('setAuthSession: 認証変更イベントを通知する', () => {
    const handler = vi.fn()
    const unsubscribe = onAuthSessionChanged(handler)

    setAuthSession('token-xyz', 'admin')

    expect(handler).toHaveBeenCalledWith({
      token: 'token-xyz',
      role: 'admin',
    })
    expect(getAuthToken()).toBe('token-xyz')
    expect(getAuthRole()).toBe('admin')

    unsubscribe()
  })
})
