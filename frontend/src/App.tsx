import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import Header from './components/layout/Header'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Logs from './pages/Logs'
import Login from './pages/Login'
import Users from './pages/Users'
import MobileSidebarDrawer from './components/layout/sidebar/MobileSidebarDrawer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import UserSettingsModal from '@/components/users/UserSettingsModal'
import { useSelfSettingsModal } from './hooks/layout/useSelfSettingsModal'
import { useMeQuery } from '@/hooks/auth/useMeQuery'

/**
 * @description 認証状態に応じて保護ルートを制御する。
 * @returns 認証済みなら子ルート、未認証ならログインへ遷移
 */
function ProtectedRoute() {
  const { ready, loggedIn } = useAuth()
  // 認証状態が確定するまでは描画を止める
  if (!ready) return null
  // 未ログインならログイン画面にリダイレクトする
  return loggedIn ? <Outlet /> : <Navigate to="/login" replace />
}

/**
 * @description ログイン画面の制御と成功時の遷移を行う。
 * @returns ログイン画面、またはトップへのリダイレクト
 */
function LoginRoute() {
  const navigate = useNavigate()
  const { ready, loggedIn, loginWithToken } = useAuth()
  // 認証状態が確定するまでは描画を止める
  if (!ready) return null
  // 既にログイン済みならトップへ戻す
  if (loggedIn) return <Navigate to="/" replace />
  return (
    <Login
      onLoginSuccess={(token) => {
        // トークンを保持してからトップに遷移する
        loginWithToken(token)
        navigate('/', { replace: true })
      }}
    />
  )
}

/**
 * @description ログイン済みユーザー向けのレイアウトを表示する
 * @returns サイドバーとヘッダーを含むアプリの骨組み
 */
function AppLayout() {
  const meQuery = useMeQuery()
  const me = meQuery.data
  const isAdmin = me?.role === 'admin'

  const {
    mobileOpen,
    isSelfSettingsOpen,
    openMobile,
    closeMobile,
    openSelfSettings,
    closeSelfSettings,
    selfSettingsViewModel,
  } = useSelfSettingsModal({
    userId: me?.id ?? null,
  })

  return (
    <div className="min-h-screen w-full bg-neutral-50 md:h-screen md:overflow-hidden md:[--header-h:64px]">
      {/* Header */}
      <Header setMobileOpen={(next) => (next ? openMobile() : closeMobile())} />

      <div className="flex w-full md:h-[calc(100vh-var(--header-h))] md:overflow-hidden">
        {/* サイドバー（デスクトップ：常時表示 / モバイル：非表示） */}
        <aside className="hidden w-[260px] shrink-0 border-r bg-emerald-600 md:block md:h-full md:overflow-y-auto">
          <Sidebar
            currentUserName={me?.name ?? ''}
            isAdmin={isAdmin}
            onOpenSelfSettings={openSelfSettings}
          />
        </aside>

        {/* メイン */}
        <main className="flex-1 min-w-0 w-full md:p-3 md:h-full md:overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* モバイル用ドロワー（オーバーレイ + 左スライド） */}
      <MobileSidebarDrawer
        isOpen={mobileOpen}
        onClose={closeMobile}
        currentUserName={me?.name ?? ''}
        isAdmin={isAdmin}
        onOpenSelfSettings={openSelfSettings}
      />

      {/* ユーザー設定モーダル */}
      <UserSettingsModal
        open={isSelfSettingsOpen}
        onClose={closeSelfSettings}
        viewModel={selfSettingsViewModel}
      />
    </div>
  )
}

/**
 * @description 認証プロバイダとルーティングを組み立てる。
 * @returns アプリ全体のルート構成
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
