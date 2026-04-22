import { Button } from '@/components/ui/button'
import { FiTrash2 } from 'react-icons/fi'

type HealthLogPhotoInputProps = {
  /** 写真識別子一覧 */
  photos: string[]
  /** 写真識別子一覧を更新する処理 */
  onChangePhotos: (value: string[]) => void
}

/**
 * @description 健康記録フォームの写真入力UIを表示する
 */

export default function HealthLogPhotoInput({ photos, onChangePhotos }: HealthLogPhotoInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">写真</label>
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
        {photos.length > 0 ? (
          // 写真あり
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-background text-xs text-muted-foreground">
                写真
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{photos[0]}</p>
                <p className="text-xs text-muted-foreground">仮の写真識別子です</p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => onChangePhotos([])}>
              <FiTrash2 className="h-5 w-5 text-red-500" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          // 写真なし
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">写真はまだ追加されていません</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onChangePhotos(['sample-photo-1'])}
            >
              写真を追加
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
