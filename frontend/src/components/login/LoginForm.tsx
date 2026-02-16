import type { FormEvent } from 'react'

type LoginFormProps = {
  email: string
  password: string
  error: string | null
  loading: boolean
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function LoginForm({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="メールアドレス"
        className="w-full border rounded p-2"
        required
      />
      <input
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="パスワード"
        className="w-full border rounded p-2"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}
