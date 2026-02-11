import { useState } from 'react'
import type { UserListItem, UserRole } from '@/types/users'

export type EditForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

/**
 * @description users編集フォーム状態を管理する
 * @returns 編集対象とフォーム状態および操作
 */
export function useUserEditState() {
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState<EditForm>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  })

  // 編集開始時にフォームへ現在値を反映する
  const startEdit = (user: UserListItem): void => {
    // 対象ユーザーを編集状態にする
    setEditingId(user.id)

    // テーブルの表示値をフォームにコピーする
    setForm({
      name: user.name ?? '',
      email: user.email,
      password: '',
      role: user.role,
    })
  }

  // 編集をキャンセルしてフォームを初期化する
  const cancelEdit = (): void => {
    // 編集状態を解除
    setEditingId(null)

    // フォームを初期値に戻す
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
    })
  }

  return {
    editingId,
    form,
    setForm,
    startEdit,
    cancelEdit,
  }
}
