import type { UserListItem, UserRole } from '@/types/users'
import type {
  UsersActionModel,
  UsersCreateModel,
  UsersEditModel,
} from '@/types/usersPage'

type Props = {
  users: UserListItem[]
  editModel: UsersEditModel
  createModel: UsersCreateModel
  actionModel: UsersActionModel
}

/**
 * @description users一覧テーブルを表示する
 * @returns users一覧セクション
 */
export function UsersListSection({
  users,
  editModel,
  createModel,
  actionModel,
}: Props) {
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
          {createModel.isCreating && (
            <tr className="border-t bg-emerald-50/40">
              <td className="px-3 py-2">new</td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={createModel.form.name}
                  onChange={(event) =>
                    createModel.onChangeForm({ name: event.target.value })
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="email"
                  value={createModel.form.email}
                  onChange={(event) =>
                    createModel.onChangeForm({ email: event.target.value })
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={createModel.form.role}
                  onChange={(event) =>
                    createModel.onChangeForm({ role: event.target.value as UserRole })
                  }
                  className="rounded border px-2 py-1"
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                  <option value="guest">guest</option>
                </select>
              </td>
              <td className="px-3 py-2">-</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={createModel.form.password}
                    onChange={(event) =>
                      createModel.onChangeForm({ password: event.target.value })
                    }
                    placeholder="パスワード"
                    className="rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => void actionModel.onSaveCreateUser()}
                    disabled={actionModel.saving}
                    className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-60"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={createModel.onCancelCreate}
                    className="rounded border px-3 py-1"
                  >
                    キャンセル
                  </button>
                </div>
              </td>
            </tr>
          )}

          {users.map((user) => {
            const isEditing = editModel.editingId === user.id
            const isDeleting = actionModel.deletingId === user.id

            return (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.id}</td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editModel.form.name}
                      onChange={(event) => editModel.onChangeForm({ name: event.target.value })}
                      className="w-full rounded border px-2 py-1"
                    />
                  ) : (
                    (user.name ?? '-')
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editModel.form.email}
                      onChange={(event) => editModel.onChangeForm({ email: event.target.value })}
                      className="w-full rounded border px-2 py-1"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={editModel.form.role}
                      onChange={(event) =>
                        editModel.onChangeForm({ role: event.target.value as UserRole })
                      }
                      className="rounded border px-2 py-1"
                    >
                      <option value="admin">admin</option>
                      <option value="user">user</option>
                      <option value="guest">guest</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td className="px-3 py-2">{user.updated_at ?? '-'}</td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={editModel.form.password}
                        onChange={(event) => editModel.onChangeForm({ password: event.target.value })}
                        placeholder="新しいパスワード（任意）"
                        className="rounded border px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => void actionModel.onSaveUser(user.id)}
                        disabled={actionModel.saving}
                        className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-60"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={editModel.onCancelEdit}
                        className="rounded border px-3 py-1"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editModel.onStartEdit(user)}
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
                  )}
                </td>
              </tr>
            )
          })}

          {!createModel.isCreating && users.length === 0 && (
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
