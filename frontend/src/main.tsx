import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initAuthTokenFromStorage } from './lib/api/auth.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'

/**
 * @description React Query のキャッシュと再取得設定を管理する共通クライアント
 * アプリ全体で同じ QueryClient を共有する
 */
const queryClient = new QueryClient()

// 初回描画前に localStorage の認証情報をメモリへ復元する
initAuthTokenFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
