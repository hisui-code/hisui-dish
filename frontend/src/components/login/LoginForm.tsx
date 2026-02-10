import { useState } from 'react'
import { login } from '@/lib/api/auth'

type LoginFormProps = {
  onLoggedIn: (token: string) => void
}

export default function LoginForm({ onLoggedIn }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 再送信時に前回エラーを残さない
    setError(null)
    setLoading(true)

    try {
      // 認証成功時に発行トークンを親へ渡してログイン状態へ遷移する
      const body = await login(email, password)
      const token = body.auth_token
      onLoggedIn(token)
    } catch (err: unknown) {
      // API返却エラーを表示してユーザーに再入力を促す
      const message = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        className="w-full border rounded p-2"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        className="w-full border rounded p-2"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-2 rounded hover::bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}
