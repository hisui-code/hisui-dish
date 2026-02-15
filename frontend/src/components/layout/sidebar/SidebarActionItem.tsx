import SidebarItemBase from '@/components/layout/sidebar/SidebarItemBase'
import { Button } from '@/components/ui/button'

type SidebarActionItemProps = {
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}

/**
 * @description サイドバー下部の操作ボタン見た目を共通化する
 * @param icon 表示アイコン
 * @param onClick クリック時処理
 * @param children 表示ラベル
 * @returns 共通操作ボタン
 */
export default function SidebarActionItem({ icon, onClick, children }: SidebarActionItemProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full rounded-xl p-0 text-white hover:bg-emerald-700/50 hover:text-white"
    >
      <SidebarItemBase icon={icon}>{children}</SidebarItemBase>
    </Button>
  )
}
