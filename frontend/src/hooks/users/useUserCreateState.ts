import { useState } from 'react'
import type { UserRole } from '@/types/users'

export type CreateForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

/**
 * @description users新規作成フォーム状態を管理する
 * @returns 新規作成状態と操作
 */
export function useUserCreateState() {
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  })

  // ユーザー新規作成
  const openCreate = (): void => {
    setIsCreating(true)
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
    })
  }

  // ユーザー新規作成をキャンセル
  const cancelCreate = (): void => {
    setIsCreating(false)
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
    })
  }

  return {
    isCreating,
    createForm,
    setCreateForm,
    openCreate,
    cancelCreate,
  }
}
