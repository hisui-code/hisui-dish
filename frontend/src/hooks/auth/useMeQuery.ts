import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '@/lib/api/usersApi'
import { useAuth } from '@/contexts/AuthContext'

/**
 * @description ログイン中ユーザー情報を取得してキャッシュ管理する
 * @returns ログイン中ユーザー情報クエリ
 */
export function useMeQuery() {
  const { loggedIn } = useAuth()

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    // ログインしていない場合、ユーザー情報の取得を行わない
    enabled: loggedIn,
  })
}
