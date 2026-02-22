import { useState } from 'react'
import { useUserSettingsModal } from '@/hooks/users/useUserSettingsModal'

type UseSelfSettingsModalParams = {
  userId: number | null
  isAdmin: boolean
}

type UseSelfSettingsModalResult = {
  mobileOpen: boolean
  isSelfSettingsOpen: boolean
  openMobile: () => void
  closeMobile: () => void
  openSelfSettings: () => void
  closeSelfSettings: () => void
  selfSettingsViewModel: ReturnType<typeof useUserSettingsModal>
}

/**
 * @description レイアウトのモバイルドロワーと自己設定モーダルの状態を管理する
 * @param userId ログインユーザーID
 * @returns 開閉状態と操作ハンドラ
 */
export function useSelfSettingsModal({
  userId,
  isAdmin,
}: UseSelfSettingsModalParams): UseSelfSettingsModalResult {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [isSelfSettingsOpen, setIsSelfSettingsOpen] = useState<boolean>(false)

  /**
   * @description サイドバー導線から自己設定モーダルを開く
   */
  const openSelfSettings = () => {
    // userId がない状態ではモーダルを開かない
    if (userId === null) return
    // モバイルではドロワーを閉じてからモーダルを開く
    setMobileOpen(false)
    setIsSelfSettingsOpen(true)
  }

  /**
   * @description 自己設定モーダルを閉じる
   */
  const closeSelfSettings = () => {
    setIsSelfSettingsOpen(false)
  }

  const selfSettingsViewModel = useUserSettingsModal({
    open: isSelfSettingsOpen,
    mode: 'edit',
    userId,
    isAdmin,
    onClose: closeSelfSettings,
    onSaved: () => undefined,
  })
  return {
    mobileOpen,
    isSelfSettingsOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
    openSelfSettings,
    closeSelfSettings,
    selfSettingsViewModel,
  }
}
