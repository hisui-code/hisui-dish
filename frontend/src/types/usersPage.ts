import type { UserListItem } from '@/types/users'

export type UsersQueryModel = {
  users: UserListItem[]
  errorMessage: string
  isForbidden: boolean
  refetchUsers: () => Promise<unknown>
}

export type UsersActionModel = {
  deletingId: number | null
  onRemoveUser: (userId: number) => Promise<void>
}

export type UsersPageViewModel = {
  query: UsersQueryModel
  actions: UsersActionModel
}
