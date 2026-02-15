import Sidebar from './Sidebar'

type MobileSidebarDrawerProps = {
  isOpen: boolean
  onClose: () => void
  currentUserName: string
  onOpenSelfSettings: () => void
}

/**
 * @description モバイル用サイドバーの開閉とスライドアニメーションを管理する
 * @param isOpen ドロワーを開くかどうか
 * @param onClose 閉じる操作を呼び出すハンドラ
 * @returns モバイルドロワーのUI
 */

export default function MobileSidebarDrawer({
  isOpen,
  onClose,
  currentUserName,
  onOpenSelfSettings,
}: MobileSidebarDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-30 md:hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* 背景オーバーレイ */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-[220ms] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* ドロワーパネル */}
      <div
        className={`absolute inset-y-0 left-0 w-[84%] max-w-[320px] bg-emerald-600 shadow-xl min-h-screen transition-transform duration-[220ms] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar currentUserName={currentUserName} onOpenSelfSettings={onOpenSelfSettings} />
      </div>
    </div>
  )
}
