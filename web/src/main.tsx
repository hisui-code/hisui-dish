import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initAuthTokenFromStorage } from './lib/api/auth.ts'
import AppRoot from './AppRoot.tsx'

initAuthTokenFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
)
