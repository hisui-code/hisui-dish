import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { FaHome, FaCog, FaBook, FaChartBar, FaSignOutAlt } from 'react-icons/fa'

type NavItemKey = 'dashboard' | 'settings' | 'logs' | 'insights'

const items: { key: NavItemKey; label: string; icon: React.ReactNode; path: string }[] = [
  { key: 'dashboard', label: 'ダッシュボード', icon: <FaHome />, path: '/dashboard' },
  { key: 'settings', label: '設定', icon: <FaCog />, path: '/settings' },
  { key: 'logs', label: 'ログ', icon: <FaBook />, path: '/logs' },
  { key: 'insights', label: 'インサイト', icon: <FaChartBar />, path: '/insights' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex h-full flex-col justify-between bg-white">
      <div>
        <nav className="mt-4 space-y-1 px-2">
          {items.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `block w-full rounded-xl px-3.5 py-2 text-left text-[15px] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`
              }
            >
              <span className="mr-3 inline-block text-[16px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="border-t my-2" />
          <div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-3.5 mb-2  text-left text-[15px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <FaSignOutAlt size={16} />
              ログアウト
            </Button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
