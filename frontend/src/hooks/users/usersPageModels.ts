import type { Dispatch, SetStateAction } from 'react'
import { deleteUser } from '@/lib/api/usersApi'
import type { UsersActionModel } from '@/types/usersPage'

type CreateUsersActionModelParams = {
  deletingId: number | null
  setDeletingId: Dispatch<SetStateAction<number | null>>
  setActionErrorMessage: Dispatch<SetStateAction<string>>
  refetchUsers: () => Promise<unknown>
}

/**
 * @description 削除アクション用のモデルを作成する
 * @param params アクションに必要な状態と操作
 * @returns 削除アクションモデル
 */
export function createUsersActionModel(params: CreateUsersActionModelParams): UsersActionModel {
  /**
   * @description 指定ユーザーを削除する
   * @param userId 削除対象ユーザーID
   * @returns Promise<void>
   */
  const onRemoveUser = async (userId: number): Promise<void> => {
    // 誤削除を避けるため確認ダイアログで明示同意を取る
    const ok = window.confirm('このユーザーを削除しますか？')
    if (!ok) {
      return
    }

    params.setDeletingId(userId)
    params.setActionErrorMessage('')

    try {
      await deleteUser(userId)

      // 削除後は一覧を再取得して表示を同期する
      await params.refetchUsers()
    } catch (error) {
      // API例外は画面上のエラーメッセージに統一する
      const message = error instanceof Error ? error.message : 'unknown_error'
      params.setActionErrorMessage(message)
    } finally {
      params.setDeletingId(null)
    }
  }

  return {
    deletingId: params.deletingId,
    onRemoveUser,
  }
}
