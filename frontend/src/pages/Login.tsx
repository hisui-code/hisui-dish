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
    <div className="mx-auto w-full max-w-md pt-20">
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
  )
}
