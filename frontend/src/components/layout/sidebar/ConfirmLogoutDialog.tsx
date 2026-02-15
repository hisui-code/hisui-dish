import type { ReactNode, MouseEvent } from 'react'

type ConfirmLogoutDialogProps = {
  open: boolean
  title?: string
  description?: ReactNode
  // ダイアログの「はい」に対応する処理
  onConfirm: () => void
  // ダイアログの「キャンセル」や背景クリック時の処理
  onCancel: () => void
}

// ログアウト確認用モーダル
export default function ConfirmLogoutDialog({
  open,
  title = 'ログアウトしますか？',
  description = 'HisuiDishからログアウトします。',
  onConfirm,
  onCancel,
}: ConfirmLogoutDialogProps) {
  // falseのときは表示しない
  if (!open) return null

  const handleOverlayClick = () => {
    onCancel()
  }

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
    // オーバーレイにクリックが伝播しないようにする
    event.stopPropagation()
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={handleDialogClick}
      >
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="rounded-full bg-red-500 px-4 py-1.5 text-sm text-white shadow hover:bg-red-600"
            onClick={onConfirm}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
