import type { HealthLogPhoto } from '@/types/healthLog'
import { useState } from 'react'

type UseHealthLogPhotoModalResult = {
  /** 表示中の写真 */
  selectedPhoto: HealthLogPhoto | null
  /** 写真モーダルを開く */
  openPhotoModal: (photo: HealthLogPhoto) => void
  /** 写真モーダルを閉じる */
  closePhotoModal: () => void
}

/**
 * @description 健康記録の写真拡大モーダル状態を管理する
 */
export default function useHealthLogPhotoModal(): UseHealthLogPhotoModalResult {
  const [selectedPhoto, setSelectedPhoto] = useState<HealthLogPhoto | null>(null)

  const openPhotoModal = (photo: HealthLogPhoto) => {
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
