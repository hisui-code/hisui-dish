import { Button } from '@/components/ui/button'
import type { HealthLogPhoto } from '@/types/healthLog'
import type { MouseEvent } from 'react'

type HealthLogPhotoModalProps = {
  /** 写真モーダルの表示状態 */
  open: boolean
  /** 表示中の写真 */
  photo: HealthLogPhoto | null
  /** モーダルを閉じる処理 */
  onClose: () => void
}

/**
 * @description 健康記録の写真拡大モーダルを表示する
 */
export default function HealthLogPhotoModal({ open, photo, onClose }: HealthLogPhotoModalProps) {
  if (!open || !photo) {
    return null
  }

  const handleOverlayClick = () => {
    onClose()
  }

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl" onClick={handleDialogClick}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">写真を表示</h2>
          <Button type="button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>

        <div className="px-6 py-6">
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{photo.originalName}</p>
            <p>{photo.mimeType}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
