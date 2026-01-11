import { Utensils, Trash2 } from 'lucide-react'
import type { IconType } from 'react-icons'
import { FiSunrise, FiSun, FiSunset, FiMoon } from 'react-icons/fi'

import type { LogItem, TimeBand } from '@/types/logs'
import { formatTime, getTimeBand } from '@/lib/resources/logs'
import { Button } from '../ui/button'

const timeBandIcons: Record<TimeBand, IconType> = {
  all: FiSun,
  morning: FiSunrise,
  daytime: FiSun,
  evening: FiSunset,
  night: FiMoon,
}

type LogRowProps = {
  item: LogItem
  onDelete: (id: string) => void
}

export default function LogRow(props: LogRowProps) {
  const { item, onDelete } = props

  const time = formatTime(item.recordedAtIso)
  const band = getTimeBand(item.recordedAtIso)
  const TimeIcon = timeBandIcons[band]

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      {/* アイコン */}
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl">
        <Utensils className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="truncate text-sm font-medium">ごはんたべた</span>
        </div>

        <div className="mt-1 flex items-baseline gap-1 py-2 px-2">
          <span className="text-lg font-semibold tabular-nums">{item.grams}</span>
          <span className="text-sm text-muted-foreground">g</span>
        </div>
      </div>

      {/*時間帯アイコン＋時間 */}
      <div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-sm font-semibold tabular-nums tracking-tight">
          <TimeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-muted-foreground">{time}</span>
        </span>
      </div>
      {/* 削除ボタン */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="削除"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
