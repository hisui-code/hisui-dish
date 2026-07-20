import HealthLogPhotoInput from '@/components/healthlog/HealthLogPhotoInput'
import { Button } from '@/components/ui/button'

import { healthLogTypeLabels, healthLogTypes } from '@/lib/health-log/constants'
import { FiTrash2 } from 'react-icons/fi'

import type { HealthLogFormModalViewModel } from '@/types/healthLogPage'

/**
 * @description 健康記録の追加・編集フォームモーダルを表示する
 * 入力中の値は親コンポーネントから受け取り、表示と入力欄に専念する
 */
export default function HealthLogFormModal({ form, state, actions }: HealthLogFormModalViewModel) {
  const { selectedRecordType, occurredDate, occurredTime, note, weightKg, photos } = form

  const {
    open,
    mode,
    errorMessage,
    isSaving,
    isUploadingPhoto,
    isDeletingPhoto,
    photoErrorMessage,
  } = state

  const {
    onSave,
    onUploadPhoto,
    onRemovePhoto,
    onDelete,
    onClose,
    onChangeRecordType,
    onChangeOccurredDate,
    onChangeOccurredTime,
    onChangeNote,
    onChangeWeightKg,
  } = actions

  if (!open) {
    return null
  }

  const isEditMode = mode === 'edit'
  const title = isEditMode ? '健康記録を編集' : '健康記録を追加'
  const isFormBusy = isSaving || isUploadingPhoto || isDeletingPhoto

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isFormBusy}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            閉じる
          </button>
        </div>

        {/* 日付 */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
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
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          ) : null}

          {/* エラーメッセージ */}
          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
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
          <HealthLogPhotoInput
            photos={photos}
            isUploadingPhoto={isUploadingPhoto}
            isDeletingPhoto={isDeletingPhoto}
            disabled={isSaving}
            errorMessage={photoErrorMessage}
            onUploadPhoto={onUploadPhoto}
            onRemovePhoto={onRemovePhoto}
          />
        </div>

        {/* 削除 */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <div>
            {isEditMode ? (
              <Button type="button" variant="outline" onClick={onDelete} disabled={isFormBusy}>
                <FiTrash2 className="h-5 w-5 text-red-500" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isFormBusy}>
              キャンセル
            </Button>
            <Button type="button" onClick={onSave} disabled={isFormBusy}>
              {isSaving
                ? '保存中...'
                : isUploadingPhoto
                  ? '写真アップロード中...'
                  : isDeletingPhoto
                    ? '写真削除中...'
                    : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
