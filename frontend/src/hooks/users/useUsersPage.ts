import { useState } from 'react'
import type { UsersPageViewModel, UsersCreateForm, UsersEditForm } from '@/types/usersPage'
import { useUsersQuery } from './useUsersQuery'
import {
  buildInitialCreateForm,
  buildInitialEditForm,
  buildUsersActionModel,
  buildUsersCreateModel,
  buildUsersEditModel,
} from './usersPageModels'

/**
 * @description Usersページで使う状態と操作を統合する
 * @returns Usersページ描画に必要な状態とハンドラ
 */
export function useUsersPage(): UsersPageViewModel {
  // users一覧取得と認可状態を購読する
  const queryState = useUsersQuery()
  // 編集 新規作成 保存中など画面内のUI状態を保持する
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UsersEditForm>(buildInitialEditForm)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [createForm, setCreateForm] = useState<UsersCreateForm>(buildInitialCreateForm)
  const [saving, setSaving] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string>('')

  // 編集フォームの状態と操作をViewModel化する
  const editModel = buildUsersEditModel({
    editingId,
    editForm,
    setEditingId,
    setEditForm,
  })

  // 新規作成フォームの状態と操作をViewModel化する
  const createModel = buildUsersCreateModel({
    isCreating,
    createForm,
    setIsCreating,
    setCreateForm,
  })

  // 保存 削除など副作用を持つ操作をViewModel化する
  const actionModel = buildUsersActionModel({
    saving,
    deletingId,
    editForm,
    createForm,
    setSaving,
    setDeletingId,
    setActionErrorMessage,
    refetchUsers: queryState.refetch,
    onCancelEdit: editModel.onCancelEdit,
    onCancelCreate: createModel.onCancelCreate,
  })

  // 画面側へ渡す4責務のViewModelをまとめて返す
  return {
    query: {
      users: queryState.users,
      isForbidden: queryState.isForbidden,
      // アクション失敗を優先し、なければ初回取得エラーを表示する
      errorMessage: actionErrorMessage || queryState.errorMessage,
    },
    edit: editModel,
    create: createModel,
    actions: actionModel,
  }
}
