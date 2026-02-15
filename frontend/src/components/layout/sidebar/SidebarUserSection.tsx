import SidebarActionItem from '@/components/layout/sidebar/SidebarActionItem'
import { LuCat } from 'react-icons/lu'

type SidebarUserSectionProps = {
  currentUserName: string
  onOpenSelfSettings: () => void
}

/**
 * @description サイドバー左下のログインユーザー表示と設定導線を表示する
 * @param props 表示名とクリック時処理
 * @returns ユーザー表示セクション
 */
export default function SidebarUserSection({
  currentUserName,
  onOpenSelfSettings,
}: SidebarUserSectionProps) {
  return (
    <SidebarActionItem icon={<LuCat size={16} />} onClick={onOpenSelfSettings}>
      {currentUserName}
    </SidebarActionItem>
  )
}
