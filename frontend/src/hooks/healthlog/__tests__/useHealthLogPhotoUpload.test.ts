import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHealthLogPhotoUpload } from '@/hooks/healthlog/useHealthLogPhotoUpload'
import { deleteHealthLogPhoto, uploadHealthLogPhoto } from '@/lib/api/photosApi'
import type { HealthLogPhoto } from '@/types/healthLog'

vi.mock('@/lib/api/photosApi', () => ({
  uploadHealthLogPhoto: vi.fn(),
  deleteHealthLogPhoto: vi.fn(),
}))

const createPhoto = (id: string): HealthLogPhoto => ({
  id,
  disk: 'local',
  objectKey: `users/1/tmp/${id}.jpg`,
  originalName: `${id}.jpg`,
  mimeType: 'image/jpeg',
  bytes: 1234,
  visibility: 'private',
  status: 'completed',
})

function renderPhotoUploadHook(initialPhotos: HealthLogPhoto[] = []) {
  return renderHook(() => {
    const [photos, setPhotos] = useState<HealthLogPhoto[]>(initialPhotos)
    const photoUpload = useHealthLogPhotoUpload({
      photos,
      onChangePhotos: setPhotos,
    })

    return {
      photos,
      ...photoUpload,
    }
  })
}

describe('useHealthLogPhotoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('写真をアップロードし、フォームの写真を1件に更新する', async () => {
    const uploadedPhoto = createPhoto('uploaded-photo')
    vi.mocked(uploadHealthLogPhoto).mockResolvedValue(uploadedPhoto)

    const file = new File(['dummy'], 'symptom.jpg', { type: 'image/jpeg' })
    const { result } = renderPhotoUploadHook()

    await act(async () => {
      await result.current.uploadPhoto(file)
    })

    // アップロード成功後はフォームに写真メタデータを保持する
    expect(uploadHealthLogPhoto).toHaveBeenCalledWith(file)
    expect(result.current.photos).toEqual([uploadedPhoto])
    expect(result.current.photoErrorMessage).toBeNull()
  })

  it('既に写真がある場合は追加アップロードしない', async () => {
    const existingPhoto = createPhoto('existing-photo')
    const file = new File(['dummy'], 'symptom.jpg', { type: 'image/jpeg' })
    const { result } = renderPhotoUploadHook([existingPhoto])

    await act(async () => {
      await result.current.uploadPhoto(file)
    })

    // 1枚運用のため、既存写真がある状態ではAPIを呼ばない
    expect(uploadHealthLogPhoto).not.toHaveBeenCalled()
    expect(result.current.photos).toEqual([existingPhoto])
  })

  it('今回アップロードした未保存写真は削除APIを呼んでからフォームから外す', async () => {
    const uploadedPhoto = createPhoto('uploaded-photo')
    vi.mocked(uploadHealthLogPhoto).mockResolvedValue(uploadedPhoto)
    vi.mocked(deleteHealthLogPhoto).mockResolvedValue()

    const file = new File(['dummy'], 'symptom.jpg', { type: 'image/jpeg' })
    const { result } = renderPhotoUploadHook()

    await act(async () => {
      await result.current.uploadPhoto(file)
    })

    await act(async () => {
      await result.current.removePhoto(uploadedPhoto.id)
    })

    // 保存前に追加した写真は不要objectを残さないよう即削除する
    expect(deleteHealthLogPhoto).toHaveBeenCalledWith(uploadedPhoto.id)
    expect(result.current.photos).toEqual([])
  })

  it('既存写真はフォームから外し、保存成功後の削除対象として保持する', async () => {
    const existingPhoto = createPhoto('existing-photo')
    vi.mocked(deleteHealthLogPhoto).mockResolvedValue()

    const { result } = renderPhotoUploadHook([existingPhoto])

    await act(async () => {
      await result.current.removePhoto(existingPhoto.id)
    })

    // 既存写真は健康記録更新が成功するまで本体削除しない
    expect(deleteHealthLogPhoto).not.toHaveBeenCalled()
    expect(result.current.photos).toEqual([])

    await act(async () => {
      await result.current.deletePendingPhoto()
    })

    // 更新成功後に呼ばれる削除処理で既存写真を削除する
    expect(deleteHealthLogPhoto).toHaveBeenCalledWith(existingPhoto.id)
  })
})
