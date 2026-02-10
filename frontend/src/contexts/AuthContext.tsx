/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getAuthToken,
  getAuthRole,
  setAuthToken,
  initAuthTokenFromStorage,
  login as apiLogin,
  logout as apiLogout,
} from '../lib/api/auth'

type AuthContextValue = {
  ready: boolean
  loggedIn: boolean
  authToken: string | null
  role: 'admin' | 'user' | 'guest' | null
  loginWithPassword: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string, role?: 'admin' | 'user' | 'guest' | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [authTokenState, setAuthTokenState] = useState<string | null>(null)
  const [role, setRole] = useState<'admin' | 'user' | 'guest' | null>(null)

  // 初期マウント時に localStorage からトークンを復元
  useEffect(() => {
    // 初期表示時に永続化された認証情報を復元する
    initAuthTokenFromStorage()
    const token = getAuthToken()
    const restoredRole = getAuthRole()
    // Contextで扱う状態へ反映して描画判定に利用する
    setAuthTokenState(token)
    setRole(restoredRole)
    setLoggedIn(!!token)
    // 初期化完了後にルート描画を許可する
    setReady(true)
  }, [])

  // すでに別の場所で取得したトークンでログインする
  const loginWithToken = (token: string) => {
    // 永続化ストアとContext状態の両方を同期してログイン状態にする
    setAuthToken(token)
    setAuthTokenState(token) // コンテキスト内の状態も更新
    // login() 側で保存された最新roleを反映する
    setRole(getAuthRole())
    setLoggedIn(true)
  }

  // メール+パスワードで API を叩いてログインするユーティリティ（必要なら使う）
  const loginWithPassword = async (email: string, password: string) => {
    // ログインAPIの応答からトークンを取り出して認証状態に反映する
    const body = await apiLogin(email, password)
    const token = body.auth_token as string
    // ログイン成功後は共通処理へ集約する
    loginWithToken(token)
  }

  const logout = () => {
    // ローカル保存とメモリ状態の両方をクリアする
    apiLogout() // lib/api/auth 側の状態 & localStorage をクリア
    setAuthTokenState(null)
    setRole(null)
    setLoggedIn(false)
  }

  const value: AuthContextValue = {
    ready,
    loggedIn,
    authToken: authTokenState,
    role,
    loginWithPassword,
    loginWithToken,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
