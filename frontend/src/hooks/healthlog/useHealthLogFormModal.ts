import { useState } from 'react'
import { jst } from '@/lib/date'
import type { HealthLogRecord, HealthLogType } from '@/types/healthLog'

type UseHealthLogFormModalResult = {
  /** @description 追加・編集モーダルが開いているかどうか */
  isOpen: boolean
  /** @description 編集中の対象レコード。追加時は null */
  editingLog: HealthLogRecord | null
  /** @description 現在選択中の記録種別 */
  selectedRecordType: HealthLogType
  /** @description 発生日の入力値 */
  occurredDate: string
  /** @description 発生時刻の入力値 */
  occurredTime: string
  /** @description メモ入力欄の値 */
  note: string
  /** @description 体重入力欄の値 */
  weightKg: string
  /** @description 追加モードでモーダルを開く */
  openForCreate: () => void
  /** @description 編集モードでモーダルを開く */
  openForEdit: (log: HealthLogRecord) => void
  /** @description モーダルを閉じて入力値を初期化する */
  close: () => void
  /** @description 記録種別を更新する処理 */
  setSelectedRecordType: (value: HealthLogType) => void
  /** @description 発生日を更新する処理 */
  setOccurredDate: (value: string) => void
  /** @description 発生時刻を更新する処理 */
  setOccurredTime: (value: string) => void
  /** @description メモ入力値を更新する処理 */
  setNote: (value: string) => void
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

  const [editingLog, setEditingLog] = useState<HealthLogRecord | null>(null)
  // 種別
  const [selectedRecordType, setSelectedRecordType] = useState<HealthLogType>('vomit')
  // ノート
  const [note, setNote] = useState('')
  // 体重
  const [weightKg, setWeightKg] = useState('')

  /**  新規追加 モーダルを開く */
  const openForCreate = () => {
    setIsOpen(true)
  }

  /**  編集 モーダルを開く */
  const openForEdit = (log: HealthLogRecord) => {
    setEditingLog(log)
    setSelectedRecordType(log.type)
    setOccurredDate(jst(log.occurredAt).format('YYYY-MM-DD'))
    setOccurredTime(jst(log.occurredAt).format('HH:mm'))
    setNote(log.note ?? '')
    setWeightKg(log.weightKg ? String(log.weightKg) : '')
    setIsOpen(true)
  }

  /**  フォームのリセット */
  const reset = () => {
    setEditingLog(null)
    setSelectedRecordType('vomit')
    setOccurredDate(initialOccurredDate)
    setOccurredTime(initialOccurredTime)
    setNote('')
    setWeightKg('')
  }

  /**  モーダルを閉じ、フォームの入力値を初期化する */
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
    openForCreate,
    openForEdit,
    close,
    setSelectedRecordType,
    setOccurredDate,
    setOccurredTime,
    setNote,
    setWeightKg,
  }
}
