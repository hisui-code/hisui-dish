import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchUsers } from '@/lib/api/usersApi'
import type { UserListItem } from '@/types/users'

export type UsersQueryData = {
  users: UserListItem[]
  isForbidden: boolean
  errorMessage: string
}

/**
 * @description users一覧取得の関数
 * @returns users一覧と表示用エラー状態
 */
async function fetchUsersQueryData(): Promise<UsersQueryData> {
  try {
    const users = await fetchUsers()
    return {
      users,
      isForbidden: false,
      errorMessage: '',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'

    // 403はページ側で専用表示する
    if (message === 'forbidden') {
      return {
        users: [],
        isForbidden: true,
        errorMessage: '',
      }
    }

    // その他はページ上のエラーメッセージを表示
    return {
      users: [],
      isForbidden: false,
      errorMessage: message,
    }
  }
}

/**
 * @description users一覧取得をSuspense対応で管理する
 * @returns users一覧とエラー状態
 */
export function useUsersQuery() {
  const { data, refetch } = useSuspenseQuery<UsersQueryData>({
    queryKey: ['users'],
    queryFn: fetchUsersQueryData,
  })

  return {
    users: data.users,
    isForbidden: data.isForbidden,
    errorMessage: data.errorMessage,
    refetch,
  }
}
