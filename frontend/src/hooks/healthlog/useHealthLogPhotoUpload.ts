import { deleteHealthLogPhoto, uploadHealthLogPhoto } from '@/lib/api/photosApi'
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
  // 写真削除中の二重操作を防ぐため、処理状態を保持する
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  // 写真操作失敗時にフォームへ表示するメッセージを保持する
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string | null>(null)
  // 現在のフォーム操作中にアップロードした写真を識別する
  const [uploadedPhotoId, setUploadedPhotoId] = useState<string | null>(null)
  // 健康記録の保存成功後に削除する既存写真を保持する
  const [pendingDeletionPhotoId, setPendingDeletionPhotoId] = useState<string | null>(null)

  const uploadPhoto = async (file: File) => {
    // 記録1枚運用のため、既に写真がある場合は追加しない
    if (isUploadingPhoto || photos.length > 0) return

    setIsUploadingPhoto(true)
    setPhotoErrorMessage(null)

    try {
      // presign、画像本体アップロード、complete までをまとめて実行する
      const photo = await uploadHealthLogPhoto(file)
      setUploadedPhotoId(photo.id)
      onChangePhotos([photo])
    } catch (error) {
      // APIや通信の失敗理由をフォームで読めるメッセージへ変換する
      setPhotoErrorMessage(
        error instanceof Error ? error.message : '写真のアップロードに失敗しました'
      )
    } finally {
      // 成功・失敗どちらでも次のアップロード操作を受け付けられる状態へ戻す
      setIsUploadingPhoto(false)
    }
  }

  const removePhoto = async (photoId: string) => {
    // 写真操作中の重複実行を防ぐ
    if (isUploadingPhoto || isDeletingPhoto) return

    // 現在のフォームに存在しない写真は操作しない
    if (!photos.some((photo) => photo.id === photoId)) return

    setPhotoErrorMessage(null)

    // 既存写真はフォームから外し、健康記録の保存成功後に削除する
    if (uploadedPhotoId !== photoId) {
      setPendingDeletionPhotoId(photoId)
      onChangePhotos(photos.filter((photo) => photo.id !== photoId))
      return
    }

    setIsDeletingPhoto(true)

    try {
      // 今回アップロードした未保存の写真は、その場で本体とメタデータを削除する
      await deleteHealthLogPhoto(photoId)

      setUploadedPhotoId(null)
      onChangePhotos(photos.filter((photo) => photo.id !== photoId))
    } catch (error) {
      // 削除失敗時はフォーム上の写真を残し、再試行可能にする
      setPhotoErrorMessage(error instanceof Error ? error.message : '写真の削除に失敗しました')
    } finally {
      setIsDeletingPhoto(false)
    }
  }
  /**
   * 健康記録の更新成功後に、フォームから外された既存写真を削除する
   */
  const deletePendingPhoto = async () => {
    if (!pendingDeletionPhotoId) return

    setIsDeletingPhoto(true)
    setPhotoErrorMessage(null)

    try {
      await deleteHealthLogPhoto(pendingDeletionPhotoId)
      setPendingDeletionPhotoId(null)
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  /**
   * 保存完了またはキャンセル時にフォーム単位の写真操作状態を初期化する
   */
  const resetPhotoChanges = () => {
    setUploadedPhotoId(null)
    setPendingDeletionPhotoId(null)
    setPhotoErrorMessage(null)
  }

  return {
    isUploadingPhoto,
    isDeletingPhoto,
    photoErrorMessage,
    uploadPhoto,
    removePhoto,
    deletePendingPhoto,
    resetPhotoChanges,
  }
}
