import { Button } from '@/components/ui/button'
import { useHealthLogPhotoPreviewUrl } from '@/hooks/healthlog/useHealthLogPhotoPreviewUrl'
import type { HealthLogPhoto } from '@/types/healthLog'
import type { MouseEvent } from 'react'
import { FiImage } from 'react-icons/fi'

type HealthLogPhotoModalProps = {
  /** 写真モーダルの表示状態 */
  open: boolean
  /** 表示中の写真 */
  photo: HealthLogPhoto | null
  /** モーダルを閉じる処理 */
  onClose: () => void
}

type HealthLogPhotoContentProps = {
  /** 拡大表示する写真 */
  photo: HealthLogPhoto
}

/**
 * @description 一時URLを取得し、健康記録の写真を拡大表示する
 */
function HealthLogPhotoContent({ photo }: HealthLogPhotoContentProps) {
  const { previewUrl, hasPreviewError, markPreviewError } = useHealthLogPhotoPreviewUrl(photo.id)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="grid min-h-64 max-h-[65dvh] place-items-center overflow-hidden bg-muted/20">
        {previewUrl && !hasPreviewError ? (
          <img
            src={previewUrl}
            alt={`${photo.originalName}の拡大表示`}
            className="max-h-[65dvh] w-full object-contain"
            onError={markPreviewError}
          />
        ) : hasPreviewError ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
            <FiImage className="h-10 w-10" aria-hidden="true" />
            <p>写真を表示できません</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">写真を読み込んでいます</p>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="truncate text-sm font-medium text-foreground">{photo.originalName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{photo.mimeType}</p>
      </div>
    </div>
  )
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-4"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-log-photo-modal-title"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={handleDialogClick}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 id="health-log-photo-modal-title" className="text-lg font-semibold text-foreground">
            写真を表示
          </h2>

          <Button type="button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <HealthLogPhotoContent photo={photo} />
        </div>
      </div>
    </div>
  )
}
