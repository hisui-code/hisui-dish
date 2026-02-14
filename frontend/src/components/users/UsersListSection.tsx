import type { UserListItem } from '@/types/users'
import type { UsersActionModel } from '@/types/usersPage'

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
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-3 py-2 text-left">ID</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="px-3 py-2 text-left">Updated</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isDeleting = actionModel.deletingId === user.id

            return (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.id}</td>
                <td className="px-3 py-2">{user.name ?? '-'}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.role}</td>
                <td className="px-3 py-2">{user.updated_at ?? '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenSettings(user.id)}
                      className="rounded border px-3 py-1"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void actionModel.onRemoveUser(user.id)}
                      disabled={isDeleting}
                      className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-60"
                    >
                      削除
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
