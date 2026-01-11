/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getAuthToken,
  setAuthToken,
  initAuthTokenFromStorage,
  login as apiLogin,
  logout as apiLogout,
} from '../lib/api/auth'

type AuthContextValue = {
  ready: boolean
  loggedIn: boolean
  authToken: string | null
  // メール & パスワードでログイン（API 叩く）
  loginWithPassword: (email: string, password: string) => Promise<void>
  // すでに取得済みのトークンでログイン（Login ページからの onLoginSuccess 用）
  loginWithToken: (token: string) => void
  // ログアウト
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [authTokenState, setAuthTokenState] = useState<string | null>(null)

  // 初期マウント時に localStorage からトークンを復元
  useEffect(() => {
    initAuthTokenFromStorage()
    const token = getAuthToken()
    setAuthTokenState(token)
    setLoggedIn(!!token)
    setReady(true)
  }, [])

  // すでに別の場所で取得したトークンでログインする（Login.onLoginSuccess などから使用）
  const loginWithToken = (token: string) => {
    setAuthToken(token) // lib/api/auth 側の状態 & localStorage を更新
    setAuthTokenState(token) // コンテキスト内の状態も更新
    setLoggedIn(true)
  }

  // メール+パスワードで API を叩いてログインするユーティリティ（必要なら使う）
  const loginWithPassword = async (email: string, password: string) => {
    const body = await apiLogin(email, password)
    const token = body.auth_token as string
    loginWithToken(token)
  }

  const logout = () => {
    apiLogout() // lib/api/auth 側の状態 & localStorage をクリア
    setAuthTokenState(null)
    setLoggedIn(false)
  }

  const value: AuthContextValue = {
    ready,
    loggedIn,
    authToken: authTokenState,
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
