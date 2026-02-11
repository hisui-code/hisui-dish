import type { Dispatch, SetStateAction } from 'react'
import type { UserListItem, UserRole } from '@/types/users'
import type { EditForm } from '@/hooks/users/useUserEditState'
import type { CreateForm } from '@/hooks/users/useUserCreateState'

type Props = {
  users: UserListItem[]
  editingId: number | null
  deletingId: number | null
  saving: boolean
  isCreating: boolean
  form: EditForm
  createForm: CreateForm
  setForm: Dispatch<SetStateAction<EditForm>>
  setCreateForm: Dispatch<SetStateAction<CreateForm>>
  startEdit: (user: UserListItem) => void
  cancelEdit: () => void
  cancelCreate: () => void
  saveUser: (userId: number) => Promise<void>
  saveCreateUser: () => Promise<void>
  removeUser: (userId: number) => Promise<void>
}

/**
 * @description users一覧テーブルを表示する
 * @returns users一覧セクション
 */
export function UsersListSection({
  users,
  editingId,
  deletingId,
  saving,
  isCreating,
  form,
  createForm,
  setForm,
  setCreateForm,
  startEdit,
  cancelEdit,
  cancelCreate,
  saveUser,
  saveCreateUser,
  removeUser,
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
          {isCreating && (
            <tr className="border-t bg-emerald-50/40">
              <td className="px-3 py-2">new</td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
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
                    value={createForm.password}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="パスワード"
                    className="rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => void saveCreateUser()}
                    disabled={saving}
                    className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-60"
                  >
                    保存
                  </button>
                  <button type="button" onClick={cancelCreate} className="rounded border px-3 py-1">
                    キャンセル
                  </button>
                </div>
              </td>
            </tr>
          )}

          {users.map((user) => {
            const isEditing = editingId === user.id
            const isDeleting = deletingId === user.id

            return (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.id}</td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
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
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="w-full rounded border px-2 py-1"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={form.role}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
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
                        value={form.password}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        placeholder="新しいパスワード（任意）"
                        className="rounded border px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => void saveUser(user.id)}
                        disabled={saving}
                        className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-60"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded border px-3 py-1"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="rounded border px-3 py-1"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeUser(user.id)}
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

          {!isCreating && users.length === 0 && (
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
