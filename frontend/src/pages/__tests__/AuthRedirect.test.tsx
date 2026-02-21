import { render, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import { setAuthSession } from '@/lib/api/auth'

describe('auth redirect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // テスト開始時はログイン済み状態を作る
    setAuthSession('dummy-token', 'user')
  })

  afterEach(() => {
    // 次テストへ状態を持ち越さない
    setAuthSession(null, null)
  })

  it('401発生時にログイン画面へ戻る', async () => {
    // me取得が401になるケースを再現する
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    )

    // react-query の自動再試行を止める
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    )

    // 非同期で画面が切り替わるのを待ってから検証
    expect(await screen.findByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
  })
})
