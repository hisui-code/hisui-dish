import { FaUsers } from 'react-icons/fa'

/**
 * @description users管理ページのヘッダー領域を表示する
 * @returns ヘッダー表示
 */
export function UsersPageHeader() {
  return (
    <div className="flex items-center gap-3">
      <FaUsers className="text-xl text-emerald-600" />
      <h1 className="text-xl font-semibold text-emerald-600">ユーザー管理</h1>
      {/* 将来ここにユーザー追加UIを配置する */}
    </div>
  )
}
