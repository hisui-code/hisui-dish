import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type UseLoginFormOptions = {
  onSuccess: () => void
}

type UseLoginFormReturn = {
  email: string
  password: string
  error: string | null
  loading: boolean
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
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
