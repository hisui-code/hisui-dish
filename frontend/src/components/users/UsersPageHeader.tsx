import { FaUsers } from 'react-icons/fa'

type Props = {
  onClickNew: () => void
}

/**
 * @description users管理ページのヘッダー領域を表示する
 * @returns ヘッダー表示
 */
export function UsersPageHeader({ onClickNew }: Props) {
  return (
    <div className="flex items-center gap-3">
      <FaUsers className="text-xl text-emerald-600" />
      <h1 className="text-xl font-semibold text-emerald-600">ユーザー管理</h1>
      <button
        type="button"
        onClick={onClickNew}
        className="rounded bg-emerald-600 px-3 py-1.5 text-white text-sm hover:bg-emerald-700"
      >
        <span>＋</span>
        <span className="hidden sm:inline"> New</span>
      </button>
    </div>
  )
}
