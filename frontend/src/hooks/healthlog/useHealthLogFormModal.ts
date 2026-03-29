import { useState } from 'react'
import { jst } from '@/lib/date'
import type { HealthLogType } from '@/types/healthLog'

type UseHealthLogFormModalResult = {
  /** @description 追加モーダルが開いているかどうか */
  isOpen: boolean
  /** @description 追加モーダルを開く処理 */
  open: () => void
  /** @description 追加モーダルを閉じて入力値を初期化する処理 */
  close: () => void
  /** @description 現在選択中の記録種別 */
  selectedRecordType: HealthLogType
  /** @description 記録種別を更新する処理 */
  setSelectedRecordType: (value: HealthLogType) => void
  /** @description 発生日の入力値 */
  occurredDate: string
  /** @description 発生日を更新する処理 */
  setOccurredDate: (value: string) => void
  /** @description 発生時刻の入力値 */
  occurredTime: string
  /** @description 発生時刻を更新する処理 */
  setOccurredTime: (value: string) => void
  /** @description メモ入力欄の値 */
  note: string
  /** @description メモ入力値を更新する処理 */
  setNote: (value: string) => void
  /** @description 体重入力欄の値 */
  weightKg: string
  /** @description 体重入力値を更新する処理 */
  setWeightKg: (value: string) => void
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
  // 種別
  const [selectedRecordType, setSelectedRecordType] = useState<HealthLogType>('vomit')
  // ノート
  const [note, setNote] = useState('')
  // 体重
  const [weightKg, setWeightKg] = useState('')

  /**  モーダルを開く */
  const open = () => {
    setIsOpen(true)
  }

  /**  モーダルを閉じ、フォームの入力値を初期化する */
  const close = () => {
    setIsOpen(false)
    setSelectedRecordType('vomit')
    setOccurredDate(initialOccurredDate)
    setOccurredTime(initialOccurredTime)
    setNote('')
    setWeightKg('')
  }

  return {
    isOpen,
    open,
    close,
    selectedRecordType,
    setSelectedRecordType,
    occurredDate,
    setOccurredDate,
    occurredTime,
    setOccurredTime,
    note,
    setNote,
    weightKg,
    setWeightKg,
  }
}
