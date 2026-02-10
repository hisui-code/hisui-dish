import LoginForm from '@/components/login/LoginForm'

type LoginPageProps = {
  onLoginSuccess: (token: string) => void
}

export default function Login({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4">ログイン</h1>

        <LoginForm
          onLoggedIn={(token) => {
            // 子コンポーネントで取得したトークンをルート側へ伝播する
            onLoginSuccess(token)
          }}
        />
      </div>
    </div>
  )
}
