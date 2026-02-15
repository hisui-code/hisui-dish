import { LuCat } from 'react-icons/lu'
import { Button } from '../ui/button'

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
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={onOpenSelfSettings}
        className="w-full justify-start gap-3 rounded-xl px-3.5 mb-2  text-left text-[15px]  hover:bg-neutral-100 hover:text-neutral-800"
      >
        <LuCat size={16} />
        {currentUserName}
      </Button>
    </>
  )
}
