import type { ReactNode } from 'react'

type SidebarItemBaseProps = {
  icon: ReactNode
  children: ReactNode
  className?: string
}

/**
 * @description サイドバー項目の共通コンポーネント
 */
export default function SidebarItemBase({ icon, children, className }: SidebarItemBaseProps) {
  return (
    <span
      className={`inline-flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-[15px] ${className ?? ''}`}
    >
      <span className="inline-block text-[15px]">{icon}</span>
      {children}
    </span>
  )
}
