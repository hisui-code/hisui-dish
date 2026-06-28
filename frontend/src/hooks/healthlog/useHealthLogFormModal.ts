import { jst } from '@/lib/date'
import type { HealthLogPhoto, HealthLogRecord, HealthLogType } from '@/types/healthLog'
import { useState } from 'react'

type UseHealthLogFormModalResult = {
  /** 追加・編集モーダルが開いているかどうか */
  isOpen: boolean
  /** 編集中の対象レコード。追加時は null */
  editingLog: HealthLogRecord | null
  /** 現在選択中の記録種別 */
  selectedRecordType: HealthLogType
  /** 発生日の入力値 */
  occurredDate: string
  /** 発生時刻の入力値 */
  occurredTime: string
  /** メモ入力欄の値 */
  note: string
  /** 体重入力欄の値 */
  weightKg: string
  /** 写真メタデータ一覧 */
  photos: HealthLogPhoto[]
  /** 追加モードでモーダルを開く */
  openForCreate: () => void
  /** 編集モードでモーダルを開く */
  openForEdit: (log: HealthLogRecord) => void
  /** モーダルを閉じて入力値を初期化する */
  close: () => void
  /** 記録種別を更新する処理 */
  setSelectedRecordType: (value: HealthLogType) => void
  /** 発生日を更新する処理 */
  setOccurredDate: (value: string) => void
  /** 発生時刻を更新する処理 */
  setOccurredTime: (value: string) => void
  /** メモ入力値を更新する処理 */
  setNote: (value: string) => void
  /** 体重入力値を更新する処理 */
  setWeightKg: (value: string) => void
  /** 写真識別子一覧を更新する処理 */
  setPhotos: (value: HealthLogPhoto[]) => void
}

/**
 * @description 健康記録の追加モーダルで使う入力状態と開閉処理をまとめる
 * ページ本体からモーダル専用の state を分離する
 */
export function useHealthLogFormModal(): UseHealthLogFormModalResult {
  // フォーム初期値
  const initialOccurredDate = jst().format('YYYY-MM-DD')
  const initialOccurredTime = jst().format('HH:mm')
  // フォームの日付・時刻
  const [occurredDate, setOccurredDate] = useState(initialOccurredDate)
  const [occurredTime, setOccurredTime] = useState(initialOccurredTime)
  // フォームの開閉
  const [isOpen, setIsOpen] = useState(false)

  const [editingLog, setEditingLog] = useState<HealthLogRecord | null>(null)
  // 種別
  const [selectedRecordType, setSelectedRecordType] = useState<HealthLogType>('vomit')
  // ノート
  const [note, setNote] = useState('')
  // 体重
  const [weightKg, setWeightKg] = useState('')
  // 写真
  const [photos, setPhotos] = useState<HealthLogPhoto[]>([])

  /** 新規追加 モーダルを開く */
  const openForCreate = () => {
    setIsOpen(true)
  }

  /** 編集 モーダルを開く */
  const openForEdit = (log: HealthLogRecord) => {
    setEditingLog(log)
    setSelectedRecordType(log.type)
    setOccurredDate(jst(log.occurredAt).format('YYYY-MM-DD'))
    setOccurredTime(jst(log.occurredAt).format('HH:mm'))
    setNote(log.note ?? '')
    setWeightKg(log.weightKg ? String(log.weightKg) : '')
    setPhotos(log.photos)
    setIsOpen(true)
  }

  /** フォームのリセット */
  const reset = () => {
    setEditingLog(null)
    setSelectedRecordType('vomit')
    setOccurredDate(initialOccurredDate)
    setOccurredTime(initialOccurredTime)
    setNote('')
    setWeightKg('')
    setPhotos([])
  }

  /** モーダルを閉じ、フォームの入力値を初期化する */
  const close = () => {
    setIsOpen(false)
    reset()
  }

  return {
    isOpen,
    editingLog,
    selectedRecordType,
    occurredDate,
    occurredTime,
    note,
    weightKg,
    photos,
    openForCreate,
    openForEdit,
    close,
    setSelectedRecordType,
    setOccurredDate,
    setOccurredTime,
    setNote,
    setWeightKg,
    setPhotos,
  }
}
