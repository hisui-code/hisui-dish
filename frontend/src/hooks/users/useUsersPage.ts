import { useState } from 'react'
import { useUsersQuery } from './useUsersQuery'
import { useUserEditState } from './useUserEditState'
import { useUsersActions } from './useUsersActions'

/**
 * @description Usersページで使う状態と操作を統合する
 * @returns Usersページ描画に必要な状態とハンドラ
 */
export function useUsersPage() {
  const queryState = useUsersQuery()
  const editState = useUserEditState()
  const [actionErrorMessage, setActionErrorMessage] = useState<string>('')

  const actionsState = useUsersActions({
    form: editState.form,
    cancelEdit: editState.cancelEdit,
    setErrorMessage: setActionErrorMessage,
    refetchUsers: queryState.refetch,
  })

  return {
    users: queryState.users,
    errorMessage: actionErrorMessage || queryState.errorMessage,
    isForbidden: queryState.isForbidden,
    editingId: editState.editingId,
    form: editState.form,
    saving: actionsState.saving,
    deletingId: actionsState.deletingId,
    setForm: editState.setForm,
    startEdit: editState.startEdit,
    cancelEdit: editState.cancelEdit,
    saveUser: actionsState.saveUser,
    removeUser: actionsState.removeUser,
  }
}
