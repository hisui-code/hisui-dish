/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'

export type AuthContextValue = {
  loggedIn: boolean
  authToken: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({
  value,
  children,
}: {
  value: AuthContextValue
  children: React.ReactNode
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth は AuthProvider 内でのみ使用してください')
  }
  return ctx
}
