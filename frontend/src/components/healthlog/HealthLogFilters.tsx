import { healthLogFilterOptions } from '@/lib/health-log/constants'
import { IoFunnel } from 'react-icons/io5'
import type { HealthLogFilterType } from '@/types/healthLog'

type HealthLogFiltersProps = {
  /** 現在選択中の種別 */
  selectedType: HealthLogFilterType
  /** 現在選択中の年月 */
  selectedMonth: string
  /** 種別変更時の処理 */
  onChangeType: (value: HealthLogFilterType) => void
  /** 年月変更時の処理 */
  onChangeMonth: (value: string) => void
}

/**
 * @description 健康記録画面のフィルター表示
 */
export default function HealthLogFilters({
  selectedType,
  selectedMonth,
  onChangeType,
  onChangeMonth,
}: HealthLogFiltersProps) {
  return (
    <section className="py-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IoFunnel className="h-6 w-6" />
        </div>

        {/* 種別ボタン */}
        <div className="flex flex-1 flex-wrap gap-2">
          {healthLogFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangeType(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                option.value === selectedType
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {/* 日付選択 */}
        <div className="w-full lg:w-[180px]">
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onChangeMonth(event.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      </div>
    </section>
  )
}
