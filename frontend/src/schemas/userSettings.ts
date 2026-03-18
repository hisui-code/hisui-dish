import { z } from 'zod'
import type { UserRole } from '@/types/users'

/**
 * @description ユーザーロール入力値の許可一覧
 */
const userRoleSchema = z.enum(['admin', 'user', 'guest'] satisfies [UserRole, ...UserRole[]])

/**
 * @description ユーザー設定フォームの共通入力ルール
 * nameはサイドバー表示幅を考慮して12文字上限にする
 */
const baseUserSettingsSchema = z.object({
  name: z.string().trim().min(1, '名前は必須です').max(12, '名前は12文字以内です'),
  email: z.email('メールアドレスの形式が不正です'),
  password: z.string().max(255, 'パスワードが長すぎます'),
  passwordConfirmation: z.string().max(255, '確認用パスワードが長すぎます'),
  role: userRoleSchema,
})

/**
 * @description ユーザー作成時の入力ルール
 * create時はpasswordを必須にする
 */
const createUserSettingsSchema = baseUserSettingsSchema
  .extend({
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    passwordConfirmation: z.string().min(1, '確認用パスワードは必須です'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'パスワードと確認用パスワードが一致しません',
    path: ['passwordConfirmation'],
  })

/**
 * @description ユーザー編集時の入力ルール
 * edit時は未変更を許可するため空文字を受け付ける
 * passwordとpasswordConfirmationのどちらか一方だけ入力された場合はエラーとする
 */
const editUserSettingsSchema = baseUserSettingsSchema
  .refine((data) => data.password === '' || data.password.length >= 8, {
    message: 'パスワードは8文字以上で入力してください',
    path: ['password'],
  })
  .refine(
    (data) => {
      // パスワードと確認用両方とも空
      if (data.password === '' && data.passwordConfirmation === '') {
        return true
      }
      // パスワード確認用どちらかが入力されている
      if (data.password === '' || data.passwordConfirmation === '') {
        return false
      }
      // 両方一致
      return data.password === data.passwordConfirmation
    },
    {
      message: '確認用パスワードが一致しません',
      path: ['passwordConfirmation'],
    }
  )

export type UserSettingsSchemaInput = z.infer<typeof baseUserSettingsSchema>

/**
 * @description ユーザー設定フォームの入力値をモード別に検証する
 * @param mode 作成か編集か
 * @param form 検証対象フォーム
 * @returns 成功時は検証済み値 失敗時は表示用メッセージ
 */
export function validateUserSettingsForm(
  mode: 'create' | 'edit',
  form: UserSettingsSchemaInput
): { success: true; data: UserSettingsSchemaInput } | { success: false; message: string } {
  // createとeditでpassword要件が異なるためスキーマを切り替える
  const schema = mode === 'create' ? createUserSettingsSchema : editUserSettingsSchema
  const result = schema.safeParse(form)

  if (!result.success) {
    // 最初のエラーだけを返してモーダル上に表示する
    return {
      success: false,
      message: result.error.issues[0]?.message ?? '入力内容が不正です',
    }
  }

  return { success: true, data: result.data }
}
