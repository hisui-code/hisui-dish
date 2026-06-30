import HealthLogPhotoPreview from '@/components/healthlog/HealthLogPhotoPreview'
import { Button } from '@/components/ui/button'
import type { HealthLogPhoto } from '@/types/healthLog'
import { type ChangeEvent, useId, useRef } from 'react'
import { FiImage, FiUploadCloud } from 'react-icons/fi'

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
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedPhoto = photos[0] ?? null
  const canUploadPhoto = !selectedPhoto && !isUploadingPhoto

  const handleClickSelectPhoto = () => {
    if (!canUploadPhoto) return

    fileInputRef.current?.click()
  }

  const handleChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    onUploadPhoto(file)
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={fileInputId} className="text-sm font-medium text-foreground">
          写真
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleChangeFile}
          disabled={!canUploadPhoto}
          className="hidden"
        />

        {selectedPhoto ? (
          <HealthLogPhotoPreview photo={selectedPhoto} onRemovePhoto={onRemovePhoto} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <FiImage className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">写真はまだ追加されていません</p>
            <p className="mt-1 text-xs text-muted-foreground">
              症状や通院時の写真を1枚添付できます
            </p>
          </div>
        )}

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

        {!selectedPhoto ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <FiUploadCloud className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">写真を追加</p>
                <p className="text-xs text-muted-foreground">
                  JPEG / PNG / WebP / HEIC に対応しています
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleClickSelectPhoto}
              disabled={!canUploadPhoto}
              className="w-full sm:w-auto"
            >
              {isUploadingPhoto ? 'アップロード中...' : '写真を選択'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
