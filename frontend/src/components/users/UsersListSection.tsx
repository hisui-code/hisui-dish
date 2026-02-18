import type { UserListItem } from '@/types/users'
import type { UsersActionModel } from '@/types/usersPage'
import { formatJstDateTime } from '@/lib/date'
import { FiEdit, FiTrash2 } from 'react-icons/fi'

type Props = {
  users: UserListItem[]
  actionModel: UsersActionModel
  onOpenSettings: (userId: number) => void
}

/**
 * @description users一覧テーブルを表示する
 * @param props 一覧表示と操作に必要な値
 * @returns users一覧セクション
 */
export function UsersListSection({ users, actionModel, onOpenSettings }: Props) {
  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full table-fixed text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="hidden px-3 py-2 text-left md:table-cell">ID</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="hidden px-3 py-2 text-left md:table-cell">Email</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="hidden px-3 py-2 text-left md:table-cell">Updated</th>
            <th className="w-[132px] px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isDeleting = actionModel.deletingId === user.id

            return (
              <tr key={user.id} className="border-t">
                <td className="hidden px-3 py-2 md:table-cell">{user.id}</td>
                <td className="px-3 py-2">{user.name ?? '-'}</td>
                <td className="hidden px-3 py-2 md:table-cell">{user.email}</td>
                <td className="px-3 py-2">{user.role}</td>
                <td className="hidden px-3 py-2 md:table-cell">
                  {formatJstDateTime(user.updated_at)}
                </td>
                <td className="w-[96px] px-3 py-2 align-top">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => onOpenSettings(user.id)}
                      aria-label="ユーザーを編集"
                      title="編集"
                      className="inline-flex h-8 w-12 items-center justify-center rounded border text-slate-700 hover:bg-slate-50"
                    >
                      <FiEdit className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void actionModel.onRemoveUser(user.id)}
                      disabled={isDeleting}
                      aria-label="ユーザーを削除"
                      title="削除"
                      className="inline-flex h-8 w-12 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      <FiTrash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}

          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                ユーザーが見つかりません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
