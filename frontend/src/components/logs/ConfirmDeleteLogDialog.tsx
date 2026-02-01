import type { ReactNode, MouseEvent } from 'react'
import type { LogItem } from '@/types/logs'
import { jst } from '@/lib/date'

type ConfirmDeleteLogDialogProps = {
  open: boolean
  target?: LogItem | null
  title?: string
  description?: ReactNode
  isSubmitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * @description ISO文字列から月日と時間を取り出して表示用に整形する
 * @param recordedAtIso 記録時刻のISO文字列
 * @returns 月日と時間の表示文字列
 */
function formatRecordedAt(recordedAtIso: string): string {
  return jst(recordedAtIso).format('MM/DD HH:mm')
}

/**
 * @description ログ削除の確認モーダルを表示する
 * @param open 表示フラグ
 * @param target 削除対象ログ
 * @param title モーダルのタイトル
 * @param description 補足説明
 * @param isSubmitting 削除中フラグ
 * @param onConfirm 削除実行
 * @param onCancel キャンセル
 * @returns モーダルのJSX
 */
export default function ConfirmDeleteLogDialog({
  open,
  target,
  title = 'ログを削除しますか？',
  description,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteLogDialogProps) {
  if (!open) return null

  const handleOverlayClick = () => {
    onCancel()
  }

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
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
        <p className="mt-2 text-sm text-neutral-600">{description ?? '削除したら戻せないよ！'}</p>
        {target && (
          <div className="mt-3 text-sm text-neutral-600 text-center">
            日付:{formatRecordedAt(target.recordedAtIso)} 重さ:{target.grams}g
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="rounded-full bg-red-500 px-4 py-1.5 text-sm text-white shadow hover:bg-red-600 disabled:opacity-60"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  )
}
