import { useState } from 'react'
import type { UsersPageViewModel } from '@/types/usersPage'
import { useUsersQuery } from './useUsersQuery'
import { createUsersActionModel } from './usersPageModels'

/**
 * @description Usersページで使う状態と操作を統合する
 * @returns Usersページ描画に必要な状態とハンドラ
 */
export function useUsersPage(): UsersPageViewModel {
  // users一覧取得と認可状態を購読する
  const queryState = useUsersQuery()

  // 削除とエラー表示に必要なUI状態だけを保持する
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string>('')

  // 削除など副作用を持つ操作をViewModel化する
  const actionModel = createUsersActionModel({
    deletingId,
    setDeletingId,
    setActionErrorMessage,
    refetchUsers: queryState.refetch,
  })

  // 画面側へ渡すViewModelを返す
  return {
    query: {
      users: queryState.users,
      isForbidden: queryState.isForbidden,
      errorMessage: actionErrorMessage || queryState.errorMessage,
      refetchUsers: queryState.refetch,
    },
    actions: actionModel,
  }
}
