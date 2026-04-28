import { Button } from '@/components/ui/button'
import { formatHealthLogDateTime } from '@/lib/date'
import { healthLogTypeLabels } from '@/lib/health-log/constants'
import type { HealthLogRecord } from '@/types/healthLog'
import type { MouseEvent } from 'react'

type HealthLogDeleteDialogProps = {
  /** 削除確認ダイアログの表示状態 */
  open: boolean
  /** 削除対象の健康記録 */
  target: HealthLogRecord | null
  /** 削除処理中かどうか */
  isDeleting?: boolean
  /** 削除失敗時に表示するエラーメッセージ */
  errorMessage?: string | null
  /** キャンセル時の処理 */
  onCancel: () => void
  /** 削除確定時の処理 */
  onConfirm: () => void
}

/**
 * @description 健康記録の削除確認ダイアログを表示する
 */
export default function HealthLogDeleteDialog({
  open,
  target,
  isDeleting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: HealthLogDeleteDialogProps) {
  if (!open || !target) {
    return null
  }

  const handleOverlayClick = () => {
    onCancel()
  }

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl" onClick={handleDialogClick}>
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">健康記録を削除しますか？</h2>
          <p className="mt-2 text-sm text-muted-foreground">削除した記録は戻せません</p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-foreground">
            <p>{healthLogTypeLabels[target.type]}</p>
            <p className="mt-1 text-muted-foreground">
              {formatHealthLogDateTime(target.occurredAt)}
            </p>
          </div>

          {/* エラーメッセージ */}
          {errorMessage ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
