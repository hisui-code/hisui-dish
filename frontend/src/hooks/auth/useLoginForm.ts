import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type UseLoginFormOptions = {
  onSuccess: () => void
}

/**
 * @description ログインフォームフックが返す状態と操作の型
 * 画面はこの戻り値だけを使って入力表示と送信イベントを接続する
 */
type UseLoginFormReturn = {
  /** メールアドレス入力値 */
  email: string
  /** パスワード入力値 */
  password: string
  /** 画面表示用エラーメッセージ。未発生時はnull */
  error: string | null
  /** 送信中フラグ。二重送信防止と表示制御に使う */
  loading: boolean
  /** メールアドレス入力の変更ハンドラ */
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  /** パスワード入力の変更ハンドラ */
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  /** フォーム送信ハンドラ */
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

/**
 * @description ログインフォームの状態管理と送信処理を担当するフック
 * 表示コンポーネントからAPI呼び出し責務を分離する
 */
export function useLoginForm({ onSuccess }: UseLoginFormOptions): UseLoginFormReturn {
  const { loginWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 入力欄の値をそのまま state へ反映する
  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 再送信時に前回エラー表示を消して状態を初期化する
    setError(null)
    setLoading(true)

    try {
      // 認証処理は AuthContext 側へ寄せて、画面側は結果だけ扱う
      await loginWithPassword(email, password)
      onSuccess()
    } catch (err: unknown) {
      // 画面表示用に失敗理由を文字列へそろえる
      const message = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(message)
    } finally {
      // 成功、失敗に関係なく送信中状態を解除する
      setLoading(false)
    }
  }
  return {
    email,
    password,
    error,
    loading,
    onEmailChange,
    onPasswordChange,
    onSubmit,
  }
}
