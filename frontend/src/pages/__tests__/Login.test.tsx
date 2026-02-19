import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import Login from '@/pages/Login'
import { useAuth } from '@/contexts/AuthContext'

// useAuth をモック化し、認証状態をテスト側で制御できるようにする
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

/**
 * @description Loginページの認証導線を検証する
 * 入力から送信までの操作で、成功時と失敗時の分岐を確認する
 */
describe('Login page', { timeout: 10_000 }, () => {
  beforeEach(() => {
    // テスト間でモック履歴を初期化する
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 前テストのDOMを破棄して要素重複を防ぐ
    cleanup()
  })

  it('入力して送信し、成功時に onLoginSuccess を呼ぶ', async () => {
    const onLoginSuccess = vi.fn()
    const loginWithPassword = vi.fn().mockResolvedValue(undefined)

    // 認証成功ケースを再現する
    mockedUseAuth.mockReturnValue({
      ready: true,
      loggedIn: false,
      authToken: null,
      loginWithPassword,
      loginWithToken: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    })

    render(<Login onLoginSuccess={onLoginSuccess} />)

    // フォーム入力をユーザー操作として再現する
    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('パスワード'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    // 認証API呼び出しと成功ハンドラ実行を確認する
    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith('user@example.com', 'password123')
      expect(onLoginSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('入力して送信し、失敗時にエラーメッセージを表示する', async () => {
    const onLoginSuccess = vi.fn()
    const loginWithPassword = vi.fn().mockRejectedValue(new Error('invalid_credentials'))

    // 認証失敗ケースを再現し、画面側のエラー表示を検証する
    mockedUseAuth.mockReturnValue({
      ready: true,
      loggedIn: false,
      authToken: null,
      loginWithPassword,
      loginWithToken: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    })

    render(<Login onLoginSuccess={onLoginSuccess} />)

    // 不正入力で送信し、失敗導線に入れる
    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('パスワード'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    // 失敗時は成功ハンドラを呼ばず、エラーメッセージを表示する
    await waitFor(() => {
      expect(screen.getByText('invalid_credentials')).toBeTruthy()
      expect(onLoginSuccess).not.toHaveBeenCalled()
    })
  })
})
