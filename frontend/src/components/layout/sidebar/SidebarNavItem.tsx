import { NavLink } from 'react-router-dom'
import SidebarItemBase from './SidebarItemBase'
type Props = {
  to: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

/**
 * @description サイドバーのナビゲーション項目を表示する
 * @param to 遷移先パス
 * @param icon 表示アイコン
 * @param label 表示ラベル
 * @returns サイドバーナビ項目
 */
export default function SidebarNavItem({ to, icon, label, onClick }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        isActive
          ? 'block bg-neutral-100 text-neutral-800 rounded-xl'
          : 'block text-white hover:bg-emerald-700/50 rounded-xl'
      }
    >
      <SidebarItemBase icon={icon}>{label}</SidebarItemBase>
    </NavLink>
  )
}
