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

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 再送信時に前回エラー表示を消して状態を初期化する
    setError(null)
    setLoading(true)

    try {
      await loginWithPassword(email, password)
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(message)
    } finally {
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
