import type { UserListItem, UserRole } from '@/types/users'

export type UsersEditForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

export type UsersCreateForm = {
  name: string
  email: string
  password: string
  role: UserRole
}

export type UsersQueryModel = {
  users: UserListItem[]
  errorMessage: string
  isForbidden: boolean
}

export type UsersEditModel = {
  editingId: number | null
  form: UsersEditForm
  onStartEdit: (user: UserListItem) => void
  onCancelEdit: () => void
  onChangeForm: (patch: Partial<UsersEditForm>) => void
}

export type UsersCreateModel = {
  isCreating: boolean
  form: UsersCreateForm
  onOpenCreate: () => void
  onCancelCreate: () => void
  onChangeForm: (patch: Partial<UsersCreateForm>) => void
}

export type UsersActionModel = {
  saving: boolean
  deletingId: number | null
  onSaveUser: (userId: number) => Promise<void>
  onSaveCreateUser: () => Promise<void>
  onRemoveUser: (userId: number) => Promise<void>
}

export type UsersPageViewModel = {
  query: UsersQueryModel
  edit: UsersEditModel
  create: UsersCreateModel
  actions: UsersActionModel
}
