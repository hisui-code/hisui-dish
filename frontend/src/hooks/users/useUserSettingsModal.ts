import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { createUser, fetchUserById, updateUser } from '@/lib/api/usersApi'
import type { UserListItem, UserRole } from '@/types/users'

type UseUserSettingsModalParams = {
  open: boolean
  mode: 'create' | 'edit'
  userId: number | null
  onClose: () => void
  onSaved: () => Promise<unknown> | void
}

export type UserSettingsForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

export type UseUserSettingsModalResult = {
  mode: 'create' | 'edit'
  isAdmin: boolean
  loading: boolean
  saving: boolean
  fetchErrorMessage: string
  saveErrorMessage: string
  form: UserSettingsForm | null
  onChangeForm: (patch: Partial<UserSettingsForm>) => void
  onSubmit: () => void
}

/**
 * @description 取得ユーザー情報をフォーム初期値へ変換する
 * @param user 取得したユーザー情報
 * @returns フォーム初期値
 */
function createInitialFormFromUser(user: UserListItem): UserSettingsForm {
  // APIレスポンスを入力フォーム表示用に整形する
  return {
    name: user.name ?? '',
    email: user.email,
    password: '',
    role: user.role,
  }
}

/**
 * @description 新規作成フォームの初期値を作る
 * @returns 新規作成フォーム初期値
 */
function createInitialCreateForm(): UserSettingsForm {
  // 新規作成時のデフォルト値を返す
  return {
    name: '',
    email: '',
    password: '',
    role: 'user',
  }
}

/**
 * @description ユーザー設定モーダルの状態と操作を管理する
 * @param params モーダル制御パラメータ
 * @returns モーダル表示用データと操作
 */
export function useUserSettingsModal(
  params: UseUserSettingsModalParams
): UseUserSettingsModalResult {
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = role === 'admin'

  // 入力中のフォーム値を保持する
  const [form, setForm] = useState<UserSettingsForm | null>(null)
  // 保存失敗時に表示するエラーメッセージを保持する
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>('')
  // モーダル1回のオープン中に初期化を1回に制御する
  const hasInitializedRef = useRef<boolean>(false)

  const userQuery = useQuery({
    queryKey: ['user', params.userId],
    queryFn: () => {
      // 編集時のみuserId必須
      if (params.userId === null) {
        throw new Error('user_id_required')
      }
      // 編集対象ユーザーの最新情報を取得する
      return fetchUserById(params.userId)
    },
    // 作成モードではユーザー詳細を取得しない
    enabled: params.open && params.mode === 'edit' && params.userId !== null,
  })

  useEffect(() => {
    // モーダルを閉じたら次回初期化できるようにフラグを戻す
    if (!params.open) {
      hasInitializedRef.current = false
      return
    }

    // createはオープン時に1回だけ初期値をセットする
    if (params.mode === 'create') {
      if (hasInitializedRef.current) return
      setForm(createInitialCreateForm())
      setSaveErrorMessage('')
      hasInitializedRef.current = true
      return
    }

    // editはデータ取得後に1回だけ初期化する
    if (!userQuery.data) return
    if (hasInitializedRef.current) return
    setForm(createInitialFormFromUser(userQuery.data))
    setSaveErrorMessage('')
    hasInitializedRef.current = true
  }, [params.open, params.mode, userQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (payload: UserSettingsForm) => {
      if (params.mode === 'create') {
        // 新規作成ではpassword必須
        if (!payload.password) {
          throw new Error('password_required')
        }
        return createUser({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: isAdmin ? payload.role : 'user',
        })
      }

      if (params.userId === null) {
        throw new Error('user_id_required')
      }

      // 編集時は非adminのrole更新を送らない
      return updateUser(params.userId, {
        name: payload.name,
        email: payload.email,
        password: payload.password || undefined,
        role: isAdmin ? payload.role : undefined,
      })
    },
    onSuccess: async () => {
      // 保存成功後は関連クエリを再取得して画面表示を同期する
      // 一覧キャッシュを更新し、編集時は対象ユーザー詳細も更新する
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      if (params.userId !== null) {
        await queryClient.invalidateQueries({ queryKey: ['user', params.userId] })
      }
      // 設定変更時にサイドバー表示名を即時反映する
      await queryClient.invalidateQueries({ queryKey: ['me'] })

      await params.onSaved()
      params.onClose()
    },
    onError: (error) => {
      // 例外型に依存しないようエラーメッセージを正規化して保持する
      const message = error instanceof Error ? error.message : 'unknown_error'
      setSaveErrorMessage(message)
    },
  })

  // createでは取得処理がないためfetchエラーは表示しない
  const fetchErrorMessage =
    params.mode === 'edit'
      ? userQuery.error instanceof Error
        ? userQuery.error.message
        : userQuery.error
          ? 'unknown_error'
          : ''
      : ''

  const onChangeForm = (patch: Partial<UserSettingsForm>): void => {
    // 変更された項目だけを部分更新する
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const onSubmit = (): void => {
    if (!form) return
    // 再送信時は前回エラーをクリアしてから保存する
    setSaveErrorMessage('')
    saveMutation.mutate(form)
  }

  return {
    mode: params.mode,
    isAdmin,
    loading: params.mode === 'edit' ? userQuery.isLoading : false,
    saving: saveMutation.isPending,
    fetchErrorMessage,
    saveErrorMessage,
    form,
    onChangeForm,
    onSubmit,
  }
}
