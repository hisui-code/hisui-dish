import { MdEdit } from 'react-icons/md'
import { IoCalendarOutline } from 'react-icons/io5'
import { formatHealthLogDateTime } from '@/lib/date'
import { healthLogTypeLabels } from '@/lib/health-log/constants'
import type { HealthLogRecord } from '@/types/healthLog'

type HealthLogTimelineItemProps = {
  /** @description 表示対象の健康記録 */
  item: HealthLogRecord
  /** @description 編集ボタン押下時の処理 */
  onEdit: (item: HealthLogRecord) => void
}

/**
 * @description 健康記録一覧の1件分を表示する
 */
export default function HealthLogTimelineItem({ item, onEdit }: HealthLogTimelineItemProps) {
  return (
    <article className="border-b border-border py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-emerald-600">
              {healthLogTypeLabels[item.type]}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <IoCalendarOutline className="h-3.5 w-3.5" />
              {formatHealthLogDateTime(item.occurredAt)}
            </span>
          </div>

          {item.type === 'weight' && item.weightKg ? (
            <>
              <p className="mt-2 text-base font-semibold text-foreground">{item.weightKg}kg</p>
              {item.note ? (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.note}</p>
              ) : null}
            </>
          ) : item.note ? (
            <p className="mt-2 text-sm leading-6 text-foreground">{item.note}</p>
          ) : null}

          {item.photos.length > 0 ? (
            <div className="mt-3 flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              写真
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => onEdit(item)}
          aria-label={`${healthLogTypeLabels[item.type]}を編集`}
        >
          <MdEdit className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
