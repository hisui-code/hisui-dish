import { Suspense, useState } from 'react'
import { Forbidden } from '@/components/layout/Forbidden'
import { UsersTableSkeleton } from '@/components/skeletons/UsersTableSkeleton'
import { useUsersPage } from '@/hooks/users/useUsersPage'
import { UsersPageHeader } from '@/components/users/UsersPageHeader'
import { UsersListSection } from '@/components/users/UsersListSection'
import UserSettingsModal from '@/components/users/UserSettingsModal'
import { useUserSettingsModal } from '@/hooks/users/useUserSettingsModal'

type UserSettingsMode = 'create' | 'edit'

/**
 * @description users管理ページを表示する
 * @returns users管理ページ
 */
function UsersContent() {
  const pageViewModel = useUsersPage()

  // 設定モーダルの表示状態と対象ユーザーを管理する
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [settingsMode, setSettingsMode] = useState<UserSettingsMode>('edit')
  const [targetUserId, setTargetUserId] = useState<number | null>(null)

  // モーダル内の取得 保存状態と操作をhookに集約する
  const userSettingsViewModel = useUserSettingsModal({
    open: isSettingsOpen,
    mode: settingsMode,
    userId: targetUserId,
    onClose: () => {
      // モーダルを閉じるときは対象IDとモードを初期化する
      setIsSettingsOpen(false)
      setTargetUserId(null)
      setSettingsMode('edit')
    },
    onSaved: async () => {
      // 保存後は一覧を再取得して表示を最新化する
      await pageViewModel.query.refetchUsers()
    },
  })

  // Newボタンは作成モードでモーダルを開く
  const onOpenCreate = () => {
    setSettingsMode('create')
    setTargetUserId(null)
    setIsSettingsOpen(true)
  }

  // 一覧の編集ボタンは対象IDを指定して編集モードで開く
  const onOpenEdit = (userId: number) => {
    setSettingsMode('edit')
    setTargetUserId(userId)
    setIsSettingsOpen(true)
  }

  // 権限がなければ403
  if (pageViewModel.query.isForbidden) {
    return <Forbidden />
  }

  return (
    <div className="p-4 space-y-4">
      {/* ヘッダーと新規作成導線 */}
      <UsersPageHeader onClickNew={onOpenCreate} />

      {/* 一覧取得や削除失敗時のメッセージを表示する */}
      {pageViewModel.query.errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageViewModel.query.errorMessage}
        </div>
      )}

      {/* users一覧と編集 削除導線を表示する */}
      <UsersListSection
        users={pageViewModel.query.users}
        actionModel={pageViewModel.actions}
        onOpenSettings={onOpenEdit}
      />

      {/* 作成と編集を共通モーダルで扱う */}
      <UserSettingsModal
        open={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false)
          setTargetUserId(null)
          setSettingsMode('edit')
        }}
        viewModel={userSettingsViewModel}
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
