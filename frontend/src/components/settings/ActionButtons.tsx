// src/components/settings/ActionButtons.tsx
import { Button } from '@/components/ui/button'

type Props = {
  onReset: () => void
  onSave: () => void
  disabledReset: boolean
  disabledSave: boolean
  saving: boolean
}

// 設定画面下部のアクションボタン群（リセット・保存）
export default function ActionButtons({
  onReset,
  onSave,
  disabledReset,
  disabledSave,
  saving,
}: Props) {
  return (
    <div className="flex gap-2">
      {/* リセットボタン */}
      <Button variant="outline" className="rounded-full" onClick={onReset} disabled={disabledReset}>
        Reset
      </Button>
      {/* セーブボタン 保存中は “Saving...” と表示 */}
      <Button
        className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
        onClick={onSave}
        disabled={disabledSave}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
