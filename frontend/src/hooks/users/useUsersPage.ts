import { useState } from 'react'
import { useUsersQuery } from './useUsersQuery'
import { useUserEditState } from './useUserEditState'
import { useUserCreateState } from './useUserCreateState'
import { useUsersActions } from './useUsersActions'

/**
 * @description Usersページで使う状態と操作を統合する
 * @returns Usersページ描画に必要な状態とハンドラ
 */
export function useUsersPage() {
  const queryState = useUsersQuery()
  const editState = useUserEditState()
  const createState = useUserCreateState()
  const [actionErrorMessage, setActionErrorMessage] = useState<string>('')

  const actionsState = useUsersActions({
    form: editState.form,
    createForm: createState.createForm,
    cancelEdit: editState.cancelEdit,
    cancelCreate: createState.cancelCreate,
    setErrorMessage: setActionErrorMessage,
    refetchUsers: queryState.refetch,
  })

  return {
    users: queryState.users,
    errorMessage: actionErrorMessage || queryState.errorMessage,
    isForbidden: queryState.isForbidden,
    editingId: editState.editingId,
    form: editState.form,
    isCreating: createState.isCreating,
    createForm: createState.createForm,
    saving: actionsState.saving,
    deletingId: actionsState.deletingId,
    setForm: editState.setForm,
    setCreateForm: createState.setCreateForm,
    startEdit: editState.startEdit,
    cancelEdit: editState.cancelEdit,
    openCreate: createState.openCreate,
    cancelCreate: createState.cancelCreate,
    saveUser: actionsState.saveUser,
    saveCreateUser: actionsState.saveCreateUser,
    removeUser: actionsState.removeUser,
  }
}
