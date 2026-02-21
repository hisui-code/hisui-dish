/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getAuthToken,
  setAuthToken,
  initAuthTokenFromStorage,
  login as apiLogin,
  logout as apiLogout,
  onAuthSessionChanged,
} from '../lib/api/auth'

type AuthContextValue = {
  /** 初期復元が完了し、認証判定に使える状態か */
  ready: boolean

  /** 現在ログイン中か */
  loggedIn: boolean

  /** 現在保持している認証トークン。未ログイン時は null */
  authToken: string | null

  /** メールアドレスとパスワードでログインし、認証状態を更新する */
  loginWithPassword: (email: string, password: string) => Promise<void>

  /** 既存トークンを使って認証状態を同期する */
  loginWithToken: (token: string) => void

  /** ログアウトして認証情報をクリアする */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * @description アプリ全体で共有する認証状態と認証操作を提供する
 * localStorage復元 ログイン反映 ログアウト反映を1箇所に集約する
 * 画面側は useAuth だけを参照して認証情報を扱えるようにする
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [authTokenState, setAuthTokenState] = useState<string | null>(null)

  // 初期マウント時に localStorage からトークンを復元
  useEffect(() => {
    // 初期表示時に永続化された認証情報を復元する
    initAuthTokenFromStorage()
    const token = getAuthToken()

    // Contextで扱う状態へ反映して描画判定に利用する
    setAuthTokenState(token)

    setLoggedIn(!!token)
    setReady(true)
  }, [])

  // 認証情報変更イベントを購読してContext状態を同期する
  // リロード時も401で失効した瞬間も認証状態を一元管理できる
  useEffect(() => {
    const unsubscribe = onAuthSessionChanged(({ token }) => {
      setAuthTokenState(token)
      setLoggedIn(!!token)
    })
    return unsubscribe
  }, [])

  /**
   * @description 既存トークンを使って認証状態をContextへ同期する
   */
  const loginWithToken = (token: string) => {
    // 永続化ストアとContext状態の両方を同期してログイン状態にする
    setAuthToken(token)
    setAuthTokenState(token) // コンテキスト内の状態も更新

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

  const logout = async () => {
    await apiLogout()
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

/**
 * @description 認証コンテキストを取得する共通フック
 * Provider外での誤使用を早期検知するため例外を投げる
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
