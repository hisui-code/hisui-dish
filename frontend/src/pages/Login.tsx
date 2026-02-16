import LoginForm from '@/components/login/LoginForm'
import { useLoginForm } from '@/hooks/auth/useLoginForm'

type LoginPageProps = {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginPageProps) {
  const { email, password, error, loading, onEmailChange, onPasswordChange, onSubmit } =
    useLoginForm({
      onSuccess: onLoginSuccess,
    })
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4">ログイン</h1>

        <LoginForm
          email={email}
          password={password}
          error={error}
          loading={loading}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
