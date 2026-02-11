import { useEffect, useMemo, useState } from 'react'
import { fetchUsers, updateUser, deleteUser } from '@/lib/api/usersApi'
import type { UserListItem, UserRole } from '@/types/users'
import { Forbidden } from '@/components/layout/Forbidden'
import { UsersTableSkeleton } from '@/components/skeletons/UsersTableSkeleton'

type EditForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

/**
 * @description users管理ページを表示する
 * @returns users管理ページ
 */
export default function Users() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [query, setQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isForbidden, setIsForbidden] = useState<boolean>(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  const [form, setForm] = useState<EditForm>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  })

  /**
   * @description 画面初期表示時にusers一覧を取得する
   * @returns Promise<void>
   */
  const loadUsers = async (): Promise<void> => {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      // 権限不足は専用表示に切り替える
      if (message === 'forbidden') {
        setIsForbidden(true)
      } else {
        setErrorMessage(message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users

    // name/email の部分一致で絞り込む
    return users.filter((user) => {
      const name = (user.name ?? '').toLowerCase()
      const email = user.email.toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [users, query])

  /**
   * @description 編集開始時にフォームへ現在値を反映する
   * @param user 編集対象ユーザー
   * @returns void
   */
  const startEdit = (user: UserListItem): void => {
    setEditingId(user.id)
    setForm({
      name: user.name ?? '',
      email: user.email,
      password: '',
      role: user.role,
    })
    setErrorMessage('')
  }

  /**
   * @description 編集をキャンセルしてフォームを初期化する
   * @returns void
   */
  const cancelEdit = (): void => {
    setEditingId(null)
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
    })
  }

  /**
   * @description 指定ユーザーを更新する
   * @param userId 更新対象ユーザーID
   * @returns Promise<void>
   */
  const saveUser = async (userId: number): Promise<void> => {
    setSaving(true)
    setErrorMessage('')

    try {
      // 部分更新のため、入力中フォームの内容をそのまま送る
      const updated = await updateUser(userId, {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
      })

      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      cancelEdit()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * @description 指定ユーザーを削除する
   * @param userId 削除対象ユーザーID
   * @returns Promise<void>
   */
  const removeUser = async (userId: number): Promise<void> => {
    const ok = window.confirm('このユーザーを削除しますか？')
    if (!ok) return

    setDeletingId(userId)
    setErrorMessage('')

    try {
      // 204 No Contentを想定してレスポンスボディは扱わない
      await deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      setErrorMessage(message)
    } finally {
      setDeletingId(null)
    }
  }

  // 権限がなければ403
  if (isForbidden) {
    return <Forbidden />
  }

  // ロード中はスケルトン表示
  if (loading) {
    return <UsersTableSkeleton />
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">ユーザー管理</h1>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="name / email で検索"
          className="w-full max-w-xs rounded border px-3 py-2 text-sm"
        />
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
            {filteredUsers.map((user) => {
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
            {filteredUsers.length === 0 && (
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
