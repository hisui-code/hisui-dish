import { Button } from '@/components/ui/button'
import { healthLogTypeLabels, healthLogTypes } from '@/lib/health-log/constants'
import { FiTrash2 } from 'react-icons/fi'

import type { HealthLogType } from '@/types/healthLog'

type HealthLogFormModalProps = {
  /** モーダルの表示状態 */
  open: boolean
  /** モーダル見出し */
  title: string
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
  /** 編集モード時に削除ボタンを表示するか */
  showDelete?: boolean
  /** 保存ボタン押下時の処理 */
  onSave: () => void
  /** 削除ボタン押下時の処理 */
  onDelete?: () => void
  /** モーダルを閉じる処理 */
  onClose: () => void
  /** 記録種別を変更する処理 */
  onChangeRecordType: (type: HealthLogType) => void
  /** 発生日を更新する処理 */
  onChangeOccurredDate: (value: string) => void
  /** 発生時刻を更新する処理 */
  onChangeOccurredTime: (value: string) => void
  /** メモ入力値を更新する処理 */
  onChangeNote: (value: string) => void
  /** 体重入力値を更新する処理 */
  onChangeWeightKg: (value: string) => void
}

/**
 * @description 健康記録の追加フォームモーダルを表示する
 * 入力中の値は親コンポーネントから受け取り、表示と入力欄に専念する
 */

export default function HealthLogFormModal({
  open,
  title,
  selectedRecordType,
  occurredDate,
  occurredTime,
  note,
  weightKg,
  showDelete = false,
  onSave,
  onDelete,
  onClose,
  onChangeRecordType,
  onChangeOccurredDate,
  onChangeOccurredTime,
  onChangeNote,
  onChangeWeightKg,
}: HealthLogFormModalProps) {
  if (!open) {
    return null
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            閉じる
          </button>
        </div>

        {/* 日付 */}
        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">日付</label>
              <input
                type="date"
                value={occurredDate}
                onChange={(event) => onChangeOccurredDate(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            {/* 時刻 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">時刻</label>
              <input
                type="time"
                value={occurredTime}
                onChange={(event) => onChangeOccurredTime(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* 種別 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">記録種別</label>
            <div className="flex flex-wrap gap-2">
              {healthLogTypes.map((type) => {
                const isActive = type === selectedRecordType
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChangeRecordType(type)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {healthLogTypeLabels[type]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 体重 */}
          {/* 種別を体重に設定したときのみ入力を可能にする */}
          {selectedRecordType === 'weight' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">体重(kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weightKg}
                onChange={(event) => onChangeWeightKg(event.target.value)}
                placeholder="3.80"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          ) : null}

          {/* メモ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">メモ</label>
            <textarea
              rows={4}
              value={note}
              onChange={(event) => onChangeNote(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="症状の様子や通院内容を記録します"
            />
          </div>

          {/* 写真 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">写真</label>
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              写真アップロード領域
            </div>
          </div>
        </div>

        {/* 削除 */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {showDelete ? (
              <Button type="button" variant="outline" onClick={onDelete}>
                <FiTrash2 className="h-5 w-5 text-red-500" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="button" onClick={onSave}>
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
