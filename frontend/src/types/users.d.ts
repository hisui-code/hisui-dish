export type UserRole = 'admin' | 'user' | 'guest'

export type UserListItem = {
  id: number
  name: string | null
  email: string
  role: UserRole
  updated_at: string | null
}

export type UpdateUserPayload = Partial<{
  name: string
  email: string
  password: string
  role: UserRole
}>
