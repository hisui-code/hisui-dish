import { FaCat } from 'react-icons/fa'
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
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* ブランド表示 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
          <FaCat size={30} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">HisuiDish</h1>
        </div>
      </div>
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
    </div>
  )
}
