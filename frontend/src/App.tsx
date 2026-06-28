import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import Header from './components/layout/Header'
import MobileSidebarDrawer from './components/layout/sidebar/MobileSidebarDrawer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import UserSettingsModal from '@/components/users/UserSettingsModal'
import { useSelfSettingsModal } from './hooks/layout/useSelfSettingsModal'
import { useMeQuery } from '@/hooks/auth/useMeQuery'
import { Forbidden } from '@/components/layout/Forbidden'
import { FullScreenLoading } from '@/components/layout/FullScreenLoading'
import { useAppLayoutContext } from '@/hooks/layout/useAppLayoutContext'
import type { AppLayoutOutletContext } from '@/hooks/layout/useAppLayoutContext'

// 各ページを遅延読み込みにし、初期chunkへ全画面の依存を含めない
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const HealthLog = lazy(() => import('@/pages/HealthLog'))
const Logs = lazy(() => import('@/pages/Logs'))
const Login = lazy(() => import('@/pages/Login'))
const Settings = lazy(() => import('@/pages/Settings'))
const Users = lazy(() => import('@/pages/Users'))

type PageSuspenseProps = {
  /** 遅延読み込みするページ */
  children: ReactNode
}

/**
 * @description ページ読み込み中の表示を行う
 * 画面内の遅延読み込みでは全画面ローディングにせず、メイン領域だけを待機表示にする
 * @returns ページ読み込み中のインジケーター
 */
function PageLoading() {
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="flex items-center gap-2" aria-label="loading">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.2s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.1s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce" />
      </div>
    </div>
  )
}

/**
 * @description ページ単位の遅延読み込み境界をまとめる
 * 画面ごとの依存を初期chunkから外すために使う
 * @returns Suspenseで包んだページ要素
 */
function PageSuspense({ children }: PageSuspenseProps) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>
}

/**
 * @description 認証状態に応じて保護ルートを制御する。
 * @returns 認証済みなら子ルート、未認証ならログインへ遷移
 */
function ProtectedRoute() {
  const { ready, loggedIn } = useAuth()
  // 認証状態が確定するまでは描画を止める
  if (!ready) return <FullScreenLoading />
  // 未ログインならログイン画面にリダイレクトする
  return loggedIn ? <Outlet /> : <Navigate to="/login" replace />
}

/**
 * @description ログイン画面の制御と成功時の遷移を行う。
 * @returns ログイン画面、またはトップへのリダイレクト
 */
function LoginRoute() {
  const navigate = useNavigate()
  const { ready, loggedIn } = useAuth()
  // 認証状態が確定するまでは描画を止める
  if (!ready) return <FullScreenLoading />
  // 既にログイン済みならトップへ戻す
  if (loggedIn) return <Navigate to="/" replace />
  return (
    <Login
      onLoginSuccess={() => {
        navigate('/', { replace: true })
      }}
    />
  )
}

/**
 * @description 管理者専用ルートを保護する
 * 認証済みユーザーのroleを確認し、admin以外は403画面を返す
 * @returns adminなら子ルート、非adminならForbidden
 */
function AdminRoute() {
  const layoutContext = useAppLayoutContext()
  return layoutContext.isAdmin ? <Outlet context={layoutContext} /> : <Forbidden />
}

/**
 * @description ログイン済みユーザー向けのレイアウトを表示する
 * @returns サイドバーとヘッダーを含むアプリの骨組み
 */
function AppLayout() {
  const meQuery = useMeQuery()
  const me = meQuery.data
  const isAdmin = me?.role === 'admin'
  const layoutContext: AppLayoutOutletContext = { me, isAdmin }

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
    isAdmin,
  })

  if (meQuery.isLoading) return <FullScreenLoading />

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
          <Outlet context={layoutContext} />
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
          <Route
            path="/login"
            element={
              <PageSuspense>
                <LoginRoute />
              </PageSuspense>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <PageSuspense>
                    <Dashboard />
                  </PageSuspense>
                }
              />
              <Route
                path="/health-log"
                element={
                  <PageSuspense>
                    <HealthLog />
                  </PageSuspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageSuspense>
                    <Settings />
                  </PageSuspense>
                }
              />
              <Route
                path="/logs"
                element={
                  <PageSuspense>
                    <Logs />
                  </PageSuspense>
                }
              />
              <Route element={<AdminRoute />}>
                <Route
                  path="/users"
                  element={
                    <PageSuspense>
                      <Users />
                    </PageSuspense>
                  }
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
