import type { Dispatch, SetStateAction } from 'react'
import { createUser, deleteUser, updateUser } from '@/lib/api/usersApi'
import type { UserListItem } from '@/types/users'
import type {
  UsersActionModel,
  UsersCreateForm,
  UsersCreateModel,
  UsersEditForm,
  UsersEditModel,
} from '@/types/usersPage'

type CreateUsersEditModelParams = {
  editingId: number | null
  editForm: UsersEditForm
  setEditingId: Dispatch<SetStateAction<number | null>>
  setEditForm: Dispatch<SetStateAction<UsersEditForm>>
}

type CreateUsersCreateModelParams = {
  isCreating: boolean
  createForm: UsersCreateForm
  setIsCreating: Dispatch<SetStateAction<boolean>>
  setCreateForm: Dispatch<SetStateAction<UsersCreateForm>>
}

type CreateUsersActionModelParams = {
  saving: boolean
  deletingId: number | null
  editForm: UsersEditForm
  createForm: UsersCreateForm
  setSaving: Dispatch<SetStateAction<boolean>>
  setDeletingId: Dispatch<SetStateAction<number | null>>
  setActionErrorMessage: Dispatch<SetStateAction<string>>
  refetchUsers: () => Promise<unknown>
  onCancelEdit: () => void
  onCancelCreate: () => void
}

/**
 * @description 編集フォームの初期値を作成する
 * @returns 編集フォーム初期値
 */
export function createInitialEditForm(): UsersEditForm {
  return {
    name: '',
    email: '',
    password: '',
    role: 'user',
  }
}

/**
 * @description 新規作成フォームの初期値を作成する
 * @returns 新規作成フォーム初期値
 */
export function createInitialCreateForm(): UsersCreateForm {
  return {
    name: '',
    email: '',
    password: '',
    role: 'user',
  }
}

/**
 * @description 編集用のモデルを作成する
 * @param params 編集状態と更新関数
 * @returns 編集モデル
 */
export function createUsersEditModel(params: CreateUsersEditModelParams): UsersEditModel {
  /**
   * @description 編集対象のユーザーを設定する
   * @param user 編集対象ユーザー
   * @returns void
   */
  const onStartEdit = (user: UserListItem): void => {
    // 編集開始時に現在の表示値をフォームへコピーする
    params.setEditingId(user.id)
    params.setEditForm({
      name: user.name ?? '',
      email: user.email,
      password: '',
      role: user.role,
    })
  }

  /**
   * @description 編集状態を解除してフォームを初期化する
   * @returns void
   */
  const onCancelEdit = (): void => {
    params.setEditingId(null)
    params.setEditForm(createInitialEditForm())
  }

  /**
   * @description 編集フォームの一部値を更新する
   * @param patch 更新するフォーム項目
   * @returns void
   */
  const onChangeForm = (patch: Partial<UsersEditForm>): void => {
    params.setEditForm((prev) => ({ ...prev, ...patch }))
  }

  return {
    editingId: params.editingId,
    form: params.editForm,
    onStartEdit,
    onCancelEdit,
    onChangeForm,
  }
}

/**
 * @description 新規作成用のモデルを作成する
 * @param params 新規作成状態と更新関数
 * @returns 新規作成モデル
 */
export function createUsersCreateModel(params: CreateUsersCreateModelParams): UsersCreateModel {
  /**
   * @description 新規作成行を開いてフォームを初期化する
   * @returns void
   */
  const onOpenCreate = (): void => {
    params.setIsCreating(true)
    params.setCreateForm(createInitialCreateForm())
  }

  /**
   * @description 新規作成行を閉じてフォームを初期化する
   * @returns void
   */
  const onCancelCreate = (): void => {
    params.setIsCreating(false)
    params.setCreateForm(createInitialCreateForm())
  }

  /**
   * @description 新規作成フォームの一部値を更新する
   * @param patch 更新するフォーム項目
   * @returns void
   */
  const onChangeForm = (patch: Partial<UsersCreateForm>): void => {
    params.setCreateForm((prev) => ({ ...prev, ...patch }))
  }

  return {
    isCreating: params.isCreating,
    form: params.createForm,
    onOpenCreate,
    onCancelCreate,
    onChangeForm,
  }
}

/**
 * @description 保存削除アクション用のモデルを作成する
 * @param params アクションに必要な状態と操作
 * @returns 保存削除アクションモデル
 */
export function createUsersActionModel(params: CreateUsersActionModelParams): UsersActionModel {
  /**
   * @description 指定ユーザーを更新する
   * @param userId 更新対象ユーザーID
   * @returns Promise<void>
   */
  const onSaveUser = async (userId: number): Promise<void> => {
    params.setSaving(true)
    params.setActionErrorMessage('')

    try {
      // 編集フォームの入力値をAPIへそのまま送る
      await updateUser(userId, {
        name: params.editForm.name,
        email: params.editForm.email,
        password: params.editForm.password || undefined,
        role: params.editForm.role,
      })

      // 更新後は一覧を再取得して表示を同期する
      await params.refetchUsers()
      params.onCancelEdit()
    } catch (error) {
      // API例外は画面上のエラーメッセージに統一する
      const message = error instanceof Error ? error.message : 'unknown_error'
      params.setActionErrorMessage(message)
    } finally {
      params.setSaving(false)
    }
  }

  /**
   * @description 新規ユーザーを作成する
   * @returns Promise<void>
   */
  const onSaveCreateUser = async (): Promise<void> => {
    params.setSaving(true)
    params.setActionErrorMessage('')

    try {
      await createUser({
        name: params.createForm.name,
        email: params.createForm.email,
        password: params.createForm.password,
        role: params.createForm.role,
      })

      // 作成後は一覧再取得して新規作成状態を閉じる
      await params.refetchUsers()
      params.onCancelCreate()
    } catch (error) {
      // API例外は画面上のエラーメッセージに統一する
      const message = error instanceof Error ? error.message : 'unknown_error'
      params.setActionErrorMessage(message)
    } finally {
      params.setSaving(false)
    }
  }

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
    saving: params.saving,
    deletingId: params.deletingId,
    onSaveUser,
    onSaveCreateUser,
    onRemoveUser,
  }
}
