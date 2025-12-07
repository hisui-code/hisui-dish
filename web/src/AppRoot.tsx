import App from './App'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppSwitcher() {
  const { ready, loggedIn, loginWithToken } = useAuth()

  if (!ready) return null

  return loggedIn ? <App /> : <Login onLoginSuccess={loginWithToken} />
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <AppSwitcher />
    </AuthProvider>
  )
}
