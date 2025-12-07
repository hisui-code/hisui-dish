import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from './components/layout/Header'
import Settings from './pages/Settings'
import DashBoard from './pages/Dashboard'
import Logs from './pages/Logs'
import Insights from './pages/Insights'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

/**
 * ログイン済みユーザー向けのレイアウト（サイドバー + ヘッダー + ルーティング）
 */
function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      {/* Header */}
      <Header setMobileOpen={setMobileOpen} />

      <div className="mx-auto flex w-full max-w-6xl">
        {/* サイドバー（デスクトップ：常時表示 / モバイル：非表示） */}
        <aside className="hidden w-[260px] shrink-0 border-r bg-white md:block">
          <Sidebar />
        </aside>

        {/* メイン */}
        <main className="flex-1 min-w-0 w-full p-4 md:p-6">
          <Routes>
            <Route path="/" element={<DashBoard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/insights" element={<Insights />} />
            {/* 不正なパスに来たらダッシュボードへリダイレクト */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* モバイル用ドロワー（オーバーレイ + 左スライド） */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          {/* ドロワーパネル */}
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] bg-white shadow-xl">
            <div className="p-4">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      <footer className="border-t bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-neutral-500">
          © 2025 HisuiDish
        </div>
      </footer>
    </div>
  )
}

/**
 * 認証状態をみて Login or AppLayout を出し分けるコンポーネント
 */
function AppInner() {
  const { ready, loggedIn, loginWithToken } = useAuth()

  if (!ready) return null

  if (!loggedIn) {
    return <Login onLoginSuccess={loginWithToken} />
  }

  return <AppLayout />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  )
}
