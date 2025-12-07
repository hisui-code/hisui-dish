import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { FaHome, FaCog, FaBook, FaChartBar, FaSignOutAlt } from 'react-icons/fa'

type Props = {
  current: 'dashboard' | 'settings' | 'logs' | 'insights'
  onNav: (page: Props['current']) => void
}

export default function Sidebar({ current, onNav }: Props) {
  const items = [
    { key: 'dashboard', label: 'ダッシュボード', icon: <FaHome /> },
    { key: 'settings', label: '設定', icon: <FaCog /> },
    { key: 'logs', label: 'ログ', icon: <FaBook /> },
    { key: 'insights', label: 'インサイト', icon: <FaChartBar /> },
  ] as const

  const { logout } = useAuth()

  return (
    <aside className="flex h-full flex-col justify-between bg-white">
      <div>
        {/* ナビゲーション */}
        <nav className="mt-4 space-y-1 px-2">
          {items.map((item) => {
            const active = current === item.key
            return (
              <Button
                key={item.key}
                variant={active ? 'secondary' : 'ghost'}
                onClick={() => onNav(item.key)}
                className={`w-full justify-start gap-3 rounded-xl px-3.5 py-5 text-left text-[15px] ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="text-[16px]">{item.icon}</span>
                {item.label}
              </Button>
            )
          })}
          <div className="border-t mt-6">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-3.5 py-5 text-left text-[15px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
              onClick={logout}
            >
              <FaSignOutAlt size={16} />
              ログアウト
            </Button>
          </div>
        </nav>
      </div>

      {/* 下部 */}
      <div className="border-t px-2 pb-5 pt-3 space-y-3 text-xs text-neutral-400">
        <div className="text-neutral-400 px-1">
          <div>v1.0.0</div>
          <div>© 2025 HisuiDish</div>
        </div>
      </div>
    </aside>
  )
}
