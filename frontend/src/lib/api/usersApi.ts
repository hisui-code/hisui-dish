import { req } from './client'
import type { UserListItem, UpdateUserPayload, CreateUserPayload } from '@/types/users'

/**
 * @description ユーザー一覧を取得する
 * @returns ユーザー一覧
 */
export async function fetchUsers(): Promise<UserListItem[]> {
  const res = await req<{ users: UserListItem[] }>('/api/v1/users', { method: 'GET' })
  return res.users
}

/**
 * @description 指定ユーザーの情報を更新する
 * @param userId 更新対象ユーザーID
 * @param payload 更新内容
 * @returns 更新後のユーザー情報
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserPayload
): Promise<UserListItem> {
  const res = await req<{ user: UserListItem }>(`/api/v1/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return res.user
}

/**
 * @description 新規ユーザーを作成する
 * @param payload 作成内容
 * @returns 作成後のユーザー情報
 */
export async function createUser(payload: CreateUserPayload): Promise<UserListItem> {
  const res = await req<{ user: UserListItem }>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.user
}

/**
 * @description 指定ユーザーを削除する
 * @param userId 削除対象ユーザーID
 * @returns 削除完了を待つPromise
 */
export async function deleteUser(userId: number): Promise<void> {
  await req(`/api/v1/users/${userId}`, { method: 'DELETE' })
}
