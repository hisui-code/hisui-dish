import type { IconType } from 'react-icons'
import {
  FiFilter,
  FiSunrise,
  FiSun,
  FiSunset,
  FiMoon,
  FiAperture,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'

import type { TimeBand } from '@/types/logs'
import { timeBandLabels, shiftMonth, formatMonthLabel } from '@/lib/resources/logs'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

// 時間帯ごとのアイコン定義
const timeBandIcons: Record<TimeBand, IconType> = {
  all: FiAperture,
  morning: FiSunrise,
  daytime: FiSun,
  evening: FiSunset,
  night: FiMoon,
}

type LogsFilterProps = {
  month: string
  onMonthChange: (value: string) => void
  query: string
  onQueryChange: (value: string) => void
  timeBand: TimeBand
  onTimeBandChange: (band: TimeBand) => void
}

export default function LogsFilter({
  month,
  onMonthChange,
  query,
  onQueryChange,
  timeBand,
  onTimeBandChange,
}: LogsFilterProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center gap-2 text-base">
            <FiFilter className="h-4 w-4" aria-hidden="true" />
            検索・フィルター
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 上段: 月フィルタ + 日入力（右側に日が来る） */}
          <div className="flex flex-wrap items-end gap-3">
            {/* 月フィルター */}
            <div className="min-w-[200px] space-y-1">
              <div className="text-xs font-medium text-muted-foreground">月</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
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
                  className="h-9 w-9 rounded-full"
                  onClick={() => onMonthChange(shiftMonth(month, 1))}
                  aria-label="次の月へ"
                >
                  <FiChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* 日付入力: 月の右側に配置（同じ月の中で「日」だけを絞り込む） */}
            <div className="w-[140px] shrink-0 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">日</div>
              <div className="relative">
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="日付で検索"
                  className="h-11 rounded-2xl text-center"
                  aria-label="日でログを検索（指定月の中から絞り込み）"
                />
              </div>
            </div>
          </div>

          {/* 下段: 時間帯フィルタ */}
          <div className="space-y-1 mt-5">
            <div className="items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">時間帯</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'morning', 'daytime', 'evening', 'night'] as TimeBand[]).map((band) => {
                const Icon = timeBandIcons[band]

                return (
                  <Button
                    key={band}
                    type="button"
                    variant={timeBand === band ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                    onClick={() => onTimeBandChange(band)}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    <span>{timeBandLabels[band]}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
