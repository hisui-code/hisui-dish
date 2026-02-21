import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import { setAuthSession } from '@/lib/api/auth'

type Role = 'admin' | 'user' | 'guest'
// 各テストで生成したQueryClientを後処理で確実に破棄する
let queryClient: QueryClient | null = null

/**
 * @description 指定ロールで /api/v1/me と /api/v1/users の応答をモックする
 */
const mockFetchForRole = (role: Role) => {
  // App配下のfetchを一括で差し替えてロール別応答を再現する
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)

    // 認証ユーザー情報の取得
    if (url.includes('/api/v1/me')) {
      return new Response(
        JSON.stringify({
          user: {
            id: 1,
            name: role,
            email: `${role}@example.com`,
            role,
            updated_at: '2026-01-01T00:00:00Z',
          },
        }),
        { status: 200 }
      )
    }

    // user一覧取得(adminの場合、Usersページの表示に必要)
    if (url.includes('/api/v1/users')) {
      if (role !== 'admin') {
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
      }

      return new Response(JSON.stringify({ users: [] }), { status: 200 })
    }

    // その他はテスト失敗を防ぐため空成功を返す
    return new Response(JSON.stringify({}), { status: 200 })
  })
}

/**
 * @description QueryClientProvider付きでAppを描画する
 */
const renderApp = () => {
  // テスト中の予期しない再取得を抑えて結果を安定させる
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        gcTime: 0,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe('Users route guard', () => {
  beforeEach(() => {
    // テスト間のモック汚染を防ぐ
    vi.restoreAllMocks()
    // /users 直アクセスのルーティング状態を作る
    window.history.pushState({}, '', '/users')
  })

  afterEach(async () => {
    // クエリ実行中タスクを止めてテスト終了後の例外を防ぐ
    await queryClient?.cancelQueries()
    queryClient?.clear()
    queryClient = null
    // 描画ツリーを破棄して次テストへ影響を残さない
    cleanup()
    // 認証状態を初期化して次テストへ持ち越さない
    setAuthSession(null, null)
  })

  it('非adminは /users で Forbidden を表示する', async () => {
    setAuthSession('token-user', 'user')
    mockFetchForRole('user')

    renderApp()

    expect(await screen.findByText('このページを表示する権限がありません')).toBeInTheDocument()
  })

  it('adminは /users を表示できる', async () => {
    setAuthSession('token-admin', 'admin')
    mockFetchForRole('admin')

    renderApp()

    expect(await screen.findByRole('heading', { name: 'ユーザー管理' })).toBeInTheDocument()
  })
})
