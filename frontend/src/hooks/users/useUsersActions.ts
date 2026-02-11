import { useState } from 'react'
import { deleteUser, updateUser } from '@/lib/api/usersApi'
import type { EditForm } from './useUserEditState'

type Params = {
  form: EditForm
  cancelEdit: () => void
  setErrorMessage: (message: string) => void
  refetchUsers: () => Promise<unknown>
}

/**
 * @description users更新と削除アクションを管理する
 * @param params アクションに必要な状態と操作関数
 * @returns 更新削除の状態とハンドラ
 */
export function useUsersActions(params: Params) {
  const [saving, setSaving] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 指定したユーザーを更新する
  const saveUser = async (userId: number): Promise<void> => {
    setSaving(true)
    params.setErrorMessage('')

    try {
      // 入力中のフォームの内容をそのまま送る
      await updateUser(userId, {
        name: params.form.name,
        email: params.form.email,
        password: params.form.password || undefined,
        role: params.form.role,
      })

      // 更新後は一覧を再取得して表示
      await params.refetchUsers()
      params.cancelEdit()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      params.setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  // 指定したユーザーを削除する
  const removeUser = async (userId: number): Promise<void> => {
    const ok = window.confirm('このユーザーを削除しますか？')
    if (!ok) return

    setDeletingId(userId)
    params.setErrorMessage('')

    try {
      // 204 No Contentを想定してレスポンスボディは扱わない
      await deleteUser(userId)
      // 削除後は一覧を再取得して表示を同期する
      await params.refetchUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      params.setErrorMessage(message)
    } finally {
      setDeletingId(null)
    }
  }

  return {
    saving,
    deletingId,
    saveUser,
    removeUser,
  }
}
