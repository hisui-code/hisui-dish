import { Button } from '@/components/ui/button'
import { useHealthLogPhotoPreviewUrl } from '@/hooks/healthlog/useHealthLogPhotoPreviewUrl'
import type { HealthLogPhoto } from '@/types/healthLog'
import { FiImage, FiTrash2 } from 'react-icons/fi'

type HealthLogPhotoPreviewProps = {
  /** 表示する写真メタデータ */
  photo: HealthLogPhoto
  /** 写真削除中かどうか */
  isDeletingPhoto: boolean
  /** 親フォームの処理中で写真操作を無効にするか */
  disabled?: boolean
  /** 写真を削除する処理 */
  onRemovePhoto: (photoId: string) => Promise<void>
}

/**
 * @description 追加済み写真のファイル名、削除ボタン、プレビュー画像を表示する
 */
export default function HealthLogPhotoPreview({
  photo,
  isDeletingPhoto,
  disabled = false,
  onRemovePhoto,
}: HealthLogPhotoPreviewProps) {
  const { previewUrl, hasPreviewError, markPreviewError } = useHealthLogPhotoPreviewUrl(photo.id)

  const handleRemovePhoto = () => {
    void onRemovePhoto(photo.id)
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{photo.originalName}</p>
          <p className="text-xs text-muted-foreground">
            {isDeletingPhoto
              ? '削除中...'
              : hasPreviewError
                ? 'プレビューを表示できません'
                : photo.mimeType}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRemovePhoto}
          disabled={disabled || isDeletingPhoto}
          aria-label={`${photo.originalName}を削除`}
          className="shrink-0 text-red-500 hover:text-red-600"
        >
          <FiTrash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid aspect-[4/3] place-items-center bg-muted text-muted-foreground">
        {previewUrl && !hasPreviewError ? (
          <img
            src={previewUrl}
            alt={`${photo.originalName}のプレビュー`}
            className="h-full w-full object-contain"
            onError={markPreviewError}
          />
        ) : (
          <FiImage className="h-8 w-8" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
