import { FaCat } from 'react-icons/fa'
import { Menu } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

type Props = {
  setMobileOpen: Dispatch<SetStateAction<boolean>>
}

export default function Header({ setMobileOpen }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* 左: ハンバーガー（モバイルのみ）+ ブランド */}
        <div className="flex items-center gap-3">
          <button
            className="mr-1 grid h-9 w-9 place-items-center rounded-lg border md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 font-bold text-white">
              {/* 猫アイコン*/}
              <FaCat size={30} />
            </div>
            <span className="text-m font-semibold tracking-tight">HisuiDish</span>
          </div>
        </div>
      </div>
    </header>
  )
}
