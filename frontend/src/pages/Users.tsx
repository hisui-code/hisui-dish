import { Suspense } from 'react'
import { Forbidden } from '@/components/layout/Forbidden'
import { UsersTableSkeleton } from '@/components/skeletons/UsersTableSkeleton'
import { useUsersPage } from '@/hooks/users/useUsersPage'
import type { UserRole } from '@/types/users'

/**
 * @description users管理ページを表示する
 * @returns users管理ページ
 */
function UsersContent() {
  const {
    users,
    errorMessage,
    isForbidden,
    editingId,
    deletingId,
    saving,
    form,
    setForm,
    startEdit,
    cancelEdit,
    saveUser,
    removeUser,
  } = useUsersPage()

  // 権限がなければ403
  if (isForbidden) {
    return <Forbidden />
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">ユーザー管理</h1>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

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
    </div>
  )
}

/**
 * @description users管理ページをSuspense付きで表示する
 * @returns users管理ページ
 */
export default function Users() {
  return (
    <Suspense fallback={<UsersTableSkeleton />}>
      <UsersContent />
    </Suspense>
  )
}
