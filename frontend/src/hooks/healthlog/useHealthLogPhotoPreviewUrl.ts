import { fetchPhotoDownloadUrl } from '@/lib/api/photosApi'
import { useEffect, useState } from 'react'

type UseHealthLogPhotoPreviewUrlResult = {
  /** 写真表示用の一時URL */
  previewUrl: string | null
  /** 写真プレビューを表示できない状態かどうか */
  hasPreviewError: boolean
  /** img読み込み失敗時にプレビューエラーへ切り替える処理 */
  markPreviewError: () => void
}

/**
 * @description 写真IDから表示用の一時URLを取得し、プレビュー表示状態を管理する
 */
export function useHealthLogPhotoPreviewUrl(photoId: string): UseHealthLogPhotoPreviewUrlResult {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasPreviewError, setHasPreviewError] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadPreviewUrl = async () => {
      // 別の写真へ切り替わったとき、前回のURLやエラー表示を残さないようにする
      setPreviewUrl(null)
      setHasPreviewError(false)

      try {
        // Backendで認可済みの表示用URLを発行してもらう
        const url = await fetchPhotoDownloadUrl(photoId)

        // unmount後や別写真への切り替え後に古い結果でstate更新しないようにする
        if (!ignore) {
          setPreviewUrl(url)
        }
      } catch {
        if (!ignore) {
          setHasPreviewError(true)
        }
      }
    }

    loadPreviewUrl()

    return () => {
      ignore = true
    }
  }, [photoId])

  const markPreviewError = () => {
    setHasPreviewError(true)
  }

  return {
    previewUrl,
    hasPreviewError,
    markPreviewError,
  }
}
