import { useState } from 'react'

type UseHealthLogPhotoModalResult = {
  /** 表示中の写真識別子 */
  selectedPhoto: string | null
  /** 写真モーダルを開く */
  openPhotoModal: (photo: string) => void
  /** 写真モーダルを閉じる */
  closePhotoModal: () => void
}

/**
 * @description 健康記録の写真拡大モーダル状態を管理する
 */
export default function useHealthLogPhotoModal(): UseHealthLogPhotoModalResult {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const openPhotoModal = (photo: string) => {
    setSelectedPhoto(photo)
  }

  const closePhotoModal = () => {
    setSelectedPhoto(null)
  }

  return {
    selectedPhoto,
    openPhotoModal,
    closePhotoModal,
  }
}
