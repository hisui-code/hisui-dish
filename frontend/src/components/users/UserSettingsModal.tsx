import type { MouseEvent } from 'react'
import type { UserRole } from '@/types/users'
import type { UseUserSettingsModalResult } from '@/hooks/users/useUserSettingsModal'

type UserSettingsModalProps = {
  open: boolean
  onClose: () => void
  viewModel: UseUserSettingsModalResult
}

/**
 * @description ユーザー設定モーダルの表示を行う
 * @param props 表示と操作に必要な値
 * @returns モーダル表示
 */
export default function UserSettingsModal({ open, onClose, viewModel }: UserSettingsModalProps) {
  if (!open) return null

  const handleOverlayClick = () => onClose()

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
    // 背景クリックで閉じるイベントの伝播を止める
    event.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={handleDialogClick}
      >
        {/* ヘッダー */}
        <h2 className="text-lg font-semibold text-neutral-900">
          {viewModel.mode === 'create' ? 'ユーザー作成' : 'ユーザー設定'}
        </h2>

        {/* 読み込み中 */}
        {viewModel.loading && <p className="mt-3 text-sm text-neutral-600">読み込み中...</p>}

        {/* エラーメッセージ */}
        {viewModel.fetchErrorMessage && (
          <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {viewModel.fetchErrorMessage}
          </p>
        )}

        {!viewModel.loading && !viewModel.fetchErrorMessage && viewModel.form && (
          <div className="mt-4 space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Name</label>
              <input
                type="text"
                value={viewModel.form.name}
                onChange={(event) => viewModel.onChangeForm({ name: event.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Email</label>
              <input
                type="email"
                value={viewModel.form.email}
                onChange={(event) => viewModel.onChangeForm({ email: event.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Password</label>
              <input
                type="password"
                value={viewModel.form.password}
                onChange={(event) => viewModel.onChangeForm({ password: event.target.value })}
                placeholder={viewModel.mode === 'create' ? 'パスワード（必須）' : '変更時のみ入力'}
                className="w-full rounded border px-3 py-2"
              />
            </div>

            {/* Role */}
            {viewModel.isAdmin && (
              <div>
                <label className="mb-1 block text-sm text-neutral-700">Role</label>
                <select
                  value={viewModel.form.role}
                  onChange={(event) =>
                    viewModel.onChangeForm({ role: event.target.value as UserRole })
                  }
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                  <option value="guest">guest</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 保存時エラーメッセージ */}
        {viewModel.saveErrorMessage && (
          <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {viewModel.saveErrorMessage}
          </p>
        )}

        {/* ボタン */}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">
            キャンセル
          </button>
          <button
            type="button"
            onClick={viewModel.onSubmit}
            disabled={viewModel.loading || viewModel.saving || !viewModel.form}
            className="rounded bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {viewModel.mode === 'create' ? '作成' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
