import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '@/lib/api/usersApi'

/**
 * @description ログイン中ユーザー情報を取得してキャッシュ管理する
 * @returns ログイン中ユーザー情報クエリ
 */
export function useMeQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  })
}
