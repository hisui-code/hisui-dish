import { useEffect, useState } from 'react'
import App from './App'
import Login from './pages/Login'
import { initAuthTokenFromStorage, getAuthToken, setAuthToken } from './lib/api/auth'
import { AuthProvider } from './contexts/AuthContext'

export default function AppRoot() {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    // localStorage からトークン復元
    initAuthTokenFromStorage()
    setLoggedIn(!!getAuthToken())
    setReady(true)
  }, [])

  // 共通の login / logout ハンドラ
  const handleLogin = (token: string) => {
    setAuthToken(token)
    setLoggedIn(true)
  }

  const handleLogout = () => {
    setAuthToken(null)
    setLoggedIn(false)
  }

  if (!ready) return null

  return (
    <AuthProvider
      value={{
        loggedIn,
        authToken: getAuthToken(),
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {loggedIn ? (
        // ログイン済み
        <App />
      ) : (
        // 未ログイン
        <Login
          onLoginSuccess={(token: string) => {
            setAuthToken(token)
            setLoggedIn(true)
          }}
        />
      )}
    </AuthProvider>
  )
}
