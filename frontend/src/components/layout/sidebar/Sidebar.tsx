import { FaHome, FaCog, FaBook, FaUsers } from 'react-icons/fa'
import LogoutButton from './LogoutButton'
import { useAuth } from '@/contexts/AuthContext'
import SidebarUserSection from './SidebarUserSection'
import SidebarNavItem from './SidebarNavItem'
type SidebarProps = {
  currentUserName: string
  onOpenSelfSettings: () => void
}

type NavItemKey = 'dashboard' | 'settings' | 'logs' | 'users'

const items: { key: NavItemKey; label: string; icon: React.ReactNode; path: string }[] = [
  { key: 'dashboard', label: 'ダッシュボード', icon: <FaHome />, path: '/dashboard' },
  { key: 'settings', label: '設定', icon: <FaCog />, path: '/settings' },
  { key: 'logs', label: 'ログ', icon: <FaBook />, path: '/logs' },
]

/**
 * @description サイドバーのメニューとユーザー操作導線を表示する
 * @param currentUserName ログインユーザー名
 * @param onOpenSelfSettings 自分の設定モーダルを開くハンドラ
 * @returns サイドバーUI
 */
export default function Sidebar({ currentUserName, onOpenSelfSettings }: SidebarProps) {
  const { role } = useAuth()

  // adminのみユーザー管理メニューを追加する
  const navItems =
    role === 'admin'
      ? [
          ...items,
          { key: 'users' as const, label: 'ユーザー管理', icon: <FaUsers />, path: '/users' },
        ]
      : items

  return (
    <div className="flex h-full flex-col justify-between text-white">
      <div className=" px-2">
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => (
            <SidebarNavItem key={item.key} to={item.path} icon={item.icon} label={item.label} />
          ))}

          <div className="my-2 border-t border-white/10" />
        </nav>
        <SidebarUserSection
          currentUserName={currentUserName}
          onOpenSelfSettings={onOpenSelfSettings}
        />
        <LogoutButton />
      </div>
    </div>
  )
}
