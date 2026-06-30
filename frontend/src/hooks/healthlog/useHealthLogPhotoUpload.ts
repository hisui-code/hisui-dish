import { uploadHealthLogPhoto } from '@/lib/api/photosApi'
import type { HealthLogPhoto } from '@/types/healthLog'
import { useState } from 'react'

type UseHealthLogPhotoUploadParams = {
  photos: HealthLogPhoto[]
  onChangePhotos: (photos: HealthLogPhoto[]) => void
}

/**
 * @description 健康記録フォームの写真アップロード処理を管理する
 */
export function useHealthLogPhotoUpload({ photos, onChangePhotos }: UseHealthLogPhotoUploadParams) {
  // 写真アップロード中の二重操作を防ぐため、処理状態を保持する
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  // アップロード失敗時にフォームへ表示するメッセージを保持する
  const [photoUploadErrorMessage, setPhotoUploadErrorMessage] = useState<string | null>(null)

  const uploadPhoto = async (file: File) => {
    // 記録1枚運用のため、既に写真がある場合は追加しない
    if (isUploadingPhoto || photos.length > 0) return

    setIsUploadingPhoto(true)

    // 前回のエラー表示が残らないよう、アップロード開始時にリセットする
    setPhotoUploadErrorMessage(null)

    try {
      // presign、画像本体アップロード、complete までをまとめて実行する
      const photo = await uploadHealthLogPhoto(file)
      // 1枚だけをフォーム状態に保持する
      onChangePhotos([photo])
    } catch (error) {
      // APIや通信の失敗理由をフォームで読めるメッセージへ変換する
      setPhotoUploadErrorMessage(
        error instanceof Error ? error.message : '写真のアップロードに失敗しました'
      )
    } finally {
      // 成功・失敗どちらでも次のアップロード操作を受け付けられる状態へ戻す
      setIsUploadingPhoto(false)
    }
  }

  const removePhoto = (photoId: string) => {
    // フォーム上の紐付けだけを外し、画像本体や photos レコードの削除は別APIの責務にする
    onChangePhotos(photos.filter((photo) => photo.id !== photoId))
  }

  return {
    isUploadingPhoto,
    photoUploadErrorMessage,
    uploadPhoto,
    removePhoto,
  }
}
