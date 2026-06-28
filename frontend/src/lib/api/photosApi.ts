import { getAuthToken } from '@/lib/api/auth'
import { req } from '@/lib/api/client'
import type { HealthLogPhoto } from '@/types/healthLog'

/**
 * @description 画像アップロード開始APIのレスポンス
 */
type PresignUploadResponse = {
  /** アップロード先と保存先を示す情報 */
  upload: {
    /** 画像本体の保存先 */
    disk: 'local' | 's3'
    /** storage 内で画像を識別する保存キー */
    objectKey: string
    /** 画像本体を送信するときのHTTPメソッド */
    method: 'POST' | 'PUT'
    /** 画像本体の送信先URL */
    url: string
    /** storage へ送信するときに必要な追加ヘッダー */
    headers: Record<string, string>
    /** アップロードURLの有効期限 */
    expiresAt: string
  }
}

/**
 * @description 画像アップロード完了APIのレスポンス
 */
type CompleteUploadResponse = {
  /** DBに保存された写真メタデータ */
  photo: HealthLogPhoto
}

/**
 * @description 画像アップロード開始情報を取得する
 */
async function presignPhotoUpload(file: File): Promise<PresignUploadResponse['upload']> {
  const res = await req<PresignUploadResponse>('/api/v1/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type,
      bytes: file.size,
    }),
  })

  return res.upload
}

/**
 * @description local disk 用のアップロードAPIへ画像本体を送信する
 */
async function uploadLocalPhoto(upload: PresignUploadResponse['upload'], file: File) {
  const token = getAuthToken()
  const formData = new FormData()

  formData.append('object_key', upload.objectKey)
  formData.append('file', file)

  const res = await fetch(upload.url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!res.ok) {
    throw new Error('画像アップロードに失敗しました')
  }
}

/**
 * @description S3互換storageへ画像本体を直接PUTする
 */
async function uploadS3Photo(upload: PresignUploadResponse['upload'], file: File) {
  const res = await fetch(upload.url, {
    method: 'PUT',
    headers: upload.headers,
    body: file,
  })

  if (!res.ok) {
    throw new Error('画像のアップロードに失敗しました')
  }
}

/**
 * @description アップロード済み画像を確定し、写真メタデータを保存する
 */
async function completePhotoUpload(
  upload: PresignUploadResponse['upload'],
  file: File
): Promise<HealthLogPhoto> {
  const res = await req<CompleteUploadResponse>(`/api/v1/uploads/complete`, {
    method: 'POST',
    body: JSON.stringify({
      disk: upload.disk,
      object_key: upload.objectKey,
      original_name: file.name,
      mime_type: file.type,
      bytes: file.size,
    }),
  })

  return res.photo
}

/**
 * @description 画像をアップロードし、health-logに紐付ける写真メタデータを返す
 */
export async function uploadHealthLogPhoto(file: File): Promise<HealthLogPhoto> {
  const upload = await presignPhotoUpload(file)

  if (upload.disk === 's3') {
    await uploadS3Photo(upload, file)
  } else {
    await uploadLocalPhoto(upload, file)
  }

  return completePhotoUpload(upload, file)
}

/**
 * @description 写真表示用の一時URLを取得する
 */
export async function fetchPhotoDownloadUrl(photoId: string): Promise<string> {
  const res = await req<{ download: { url: string } }>(`/api/v1/photos/${photoId}/download-url`)

  return res.download.url
}
