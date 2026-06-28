import { Button } from '@/components/ui/button'
import type { HealthLogPhoto } from '@/types/healthLog'
import type { ChangeEvent } from 'react'
import { FiTrash2 } from 'react-icons/fi'

type HealthLogPhotoInputProps = {
  /** 写真メタデータ一覧 */
  photos: HealthLogPhoto[]
  /** 写真アップロード中かどうか */
  isUploadingPhoto: boolean
  /** 写真アップロードエラー */
  errorMessage?: string | null
  /** 写真ファイル選択時の処理 */
  onUploadPhoto: (file: File) => void
  /** 写真を削除する処理 */
  onRemovePhoto: (photoId: string) => void
}

/**
 * @description 健康記録フォームの写真入力UIを表示する
 */
export default function HealthLogPhotoInput({
  photos,
  isUploadingPhoto,
  errorMessage,
  onUploadPhoto,
  onRemovePhoto,
}: HealthLogPhotoInputProps) {
  const fileInputId = 'health-log-photo-input'
  const handleChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    onUploadPhoto(file)
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <label htmlFor={fileInputId} className="text-sm font-medium text-foreground">
        写真
      </label>
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
        {photos.length > 0 ? (
          <div className="space-y-2">
            {photos.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {photo.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">{photo.mimeType}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemovePhoto(photo.id)}
                  aria-label={`${photo.originalName}を削除`}
                >
                  <FiTrash2 className="h-5 w-5 text-red-500" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-3 text-center text-sm text-muted-foreground">
            写真はまだ追加されていません
          </p>
        )}

        {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}

        <div className="mt-3">
          <input
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handleChangeFile}
            disabled={isUploadingPhoto}
          />
          {isUploadingPhoto ? (
            <p className="mt-1 text-xs text-muted-foreground">アップロード中...</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
