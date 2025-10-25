import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from './components/layout/Header'
import Settings from './pages/Settings'
import DashBoard from './pages/DashBoard'
import Logs from './pages/Logs'
import Insights from './pages/Insights'

type Page = 'dashboard' | 'settings' | 'logs' | 'insights'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [mobileOpen, setMobileOpen] = useState<boolean>(false) // モバイルのドロワー開閉

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      {/* Header */}
      <Header setMobileOpen={setMobileOpen} />
      <div className="mx-auto flex max-w-6xl">
        {/* サイドバー（デスクトップ：常時表示 / モバイル：非表示） */}
        <aside className="hidden w-[260px] shrink-0 border-r bg-white md:block">
          <Sidebar current={page} onNav={setPage} />
        </aside>

        {/* メイン */}
        <main className="flex-1 p-4 md:p-6">
          {page === 'dashboard' && <DashBoard />}
          {page === 'settings' && <Settings />}
          {page === 'logs' && <Logs />}
          {page === 'insights' && <Insights />}
        </main>
      </div>

      {/* モバイル用ドロワー（超シンプル実装：オーバーレイ + 左スライド） */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          {/* 背景オーバーレイ */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          {/* ドロワーパネル */}
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] bg-white shadow-xl">
            <div className="p-4">
              <Sidebar
                current={page}
                onNav={(p) => {
                  setPage(p)
                  setMobileOpen(false)
                }}
              />
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
