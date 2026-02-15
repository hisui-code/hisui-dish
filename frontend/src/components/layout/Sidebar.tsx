import { NavLink } from 'react-router-dom'
import { FaHome, FaCog, FaBook, FaUsers } from 'react-icons/fa'
import LogoutButton from './LogoutButton'
import { useAuth } from '@/contexts/AuthContext'
import SidebarUserSection from './SidebarUserSection'

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
    <aside className="flex h-full flex-col justify-between text-white">
      <div>
        <nav className="mt-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `block w-full rounded-xl px-3.5 py-2 text-left text-[15px] transition-colors ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-800'
                    : 'text-white hover:bg-emerald-700/50'
                }`
              }
            >
              <span className="mr-3 inline-block text-[16px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-white/10" />
        </nav>
        <SidebarUserSection
          currentUserName={currentUserName}
          onOpenSelfSettings={onOpenSelfSettings}
        />
        <LogoutButton />
      </div>
    </aside>
  )
}
