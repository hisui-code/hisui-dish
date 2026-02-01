import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi'
import { IoFilter } from 'react-icons/io5'

import type { TimeBand } from '@/types/logs'
import { timeBandLabels, shiftMonth, formatMonthLabel } from '@/lib/resources/logs'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

type LogsFilterProps = {
  month: string
  onMonthChange: (value: string) => void
  query: string
  onQueryChange: (value: string) => void
  timeBand: TimeBand
  onTimeBandChange: (band: TimeBand) => void
}

/**
 * @description ログの検索・月移動・時間帯フィルターをコンパクトに表示する
 * @param month 対象月
 * @param onMonthChange 月変更ハンドラ
 * @param query 検索文字列
 * @param onQueryChange 検索変更ハンドラ
 * @param timeBand 時間帯フィルター
 * @param onTimeBandChange 時間帯変更ハンドラ
 * @returns フィルターUIのJSX
 */
export default function LogsFilter({
  month,
  onMonthChange,
  query,
  onQueryChange,
  timeBand,
  onTimeBandChange,
}: LogsFilterProps) {
  return (
    <div className="px-6 overflow-x-auto">
      <div className="flex min-w-max items-center gap-5 py-1">
        {/* フィルターアイコン */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <IoFilter className="h-6 w-6" aria-hidden="true" />
        </div>

        {/* 年月 */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium">年月：</div>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              aria-label="前の月へ"
            >
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">
              {formatMonthLabel(month)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onMonthChange(shiftMonth(month, 1))}
              aria-label="次の月へ"
            >
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {/* 日付で検索 */}
          <div className="w-[120px]">
            <Input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="日付で検索"
              className="h-9 rounded-lg text-center"
              aria-label="日でログを検索（指定月の中から絞り込み）"
            />
          </div>
        </div>

        {/* 時間帯 */}
        <div className="flex items-center gap-2 ">
          <div className="text-xs font-medium text-muted-foreground">時間帯</div>
          <div className="relative">
            <FiClock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              value={timeBand}
              onChange={(e) => onTimeBandChange(e.target.value as TimeBand)}
              aria-label="時間帯でログを絞り込み"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full appearance-none rounded-md border bg-transparent pl-9 pr-8 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            >
              {(['all', 'morning', 'daytime', 'evening', 'night'] as TimeBand[]).map((band) => (
                <option key={band} value={band}>
                  {timeBandLabels[band]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
