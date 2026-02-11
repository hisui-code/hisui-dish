import { Suspense } from 'react'
import { Forbidden } from '@/components/layout/Forbidden'
import { UsersTableSkeleton } from '@/components/skeletons/UsersTableSkeleton'
import { useUsersPage } from '@/hooks/users/useUsersPage'
import { UsersPageHeader } from '@/components/users/UsersPageHeader'
import { UsersListSection } from '@/components/users/UsersListSection'

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
    isCreating,
    createForm,
    setForm,
    setCreateForm,
    startEdit,
    cancelEdit,
    openCreate,
    cancelCreate,
    saveUser,
    saveCreateUser,
    removeUser,
  } = useUsersPage()

  // 権限がなければ403
  if (isForbidden) {
    return <Forbidden />
  }

  return (
    <div className="p-4 space-y-4">
      <UsersPageHeader onClickNew={openCreate} />

      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <UsersListSection
        users={users}
        editingId={editingId}
        deletingId={deletingId}
        saving={saving}
        isCreating={isCreating}
        form={form}
        createForm={createForm}
        setForm={setForm}
        setCreateForm={setCreateForm}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        cancelCreate={cancelCreate}
        saveUser={saveUser}
        saveCreateUser={saveCreateUser}
        removeUser={removeUser}
      />
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
