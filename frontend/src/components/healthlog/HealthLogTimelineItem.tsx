import { formatHealthLogDateTime } from '@/lib/date'
import { healthLogTypeLabels } from '@/lib/health-log/constants'
import type { HealthLogPhoto, HealthLogRecord } from '@/types/healthLog'
import type { ReactNode } from 'react'
import { MdEdit } from 'react-icons/md'

import { FaPills, FaPoo, FaStethoscope } from 'react-icons/fa'
import { FaBandage, FaNotesMedical, FaWeightScale } from 'react-icons/fa6'
import { IoCalendarOutline } from 'react-icons/io5'
import { MdSick } from 'react-icons/md'

type HealthLogTimelineItemProps = {
  /** 表示する健康記録 */
  item: HealthLogRecord
  /** 最後の要素かどうか */
  isLast: boolean
  /** 編集ボタン押下時の処理 */
  onEdit: (item: HealthLogRecord) => void
  /** 写真押下時の処理 */
  onOpenPhoto: (photo: HealthLogPhoto) => void
}

// 種別のアイコン
const healthLogTimelineIcons = {
  vomit: <MdSick className="h-6 w-6 text-orange-500" />,
  diarrhea: <FaPoo className="h-6 w-6 text-amber-500" />,
  bloody_stool: <FaPoo className="h-6 w-6 text-red-500" />,
  injury: <FaBandage className="h-6 w-6 text-rose-500" />,
  hospital_visit: <FaStethoscope className="h-6 w-6 text-emerald-600" />,
  medication: <FaPills className="h-6 w-6 text-sky-500" />,
  weight: <FaWeightScale className="h-6 w-6 text-indigo-500" />,
  other: <FaNotesMedical className="h-6 w-6 text-slate-500" />,
} satisfies Record<HealthLogRecord['type'], ReactNode>

/**
 * @description 健康記録一覧の1件分を表示する
 */
export default function HealthLogTimelineItem({
  item,
  onEdit,
  onOpenPhoto,
  isLast,
}: HealthLogTimelineItemProps) {
  return (
    <article className="flex gap-4">
      {/* タイムラインアイコン */}
      <div className="flex shrink-0 flex-col items-center">
        <span className="mt-1 items-center justify-center rounded-full bg-background">
          {healthLogTimelineIcons[item.type]}
        </span>
        {/* ライン */}
        {!isLast ? <span className="mt-2 h-full min-h-16 w-px bg-border" /> : null}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* 種別 */}
              <span className="text-sm font-semibold text-emerald-600">
                {healthLogTypeLabels[item.type]}
              </span>
              {/* 日付 */}
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <IoCalendarOutline className="h-3.5 w-3.5" />
                {formatHealthLogDateTime(item.occurredAt)}
              </span>
            </div>
          </div>

          {/* 編集ボタン */}
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onEdit(item)}
            aria-label={`${healthLogTypeLabels[item.type]}を編集`}
          >
            <MdEdit className="h-4 w-4" />
          </button>
        </div>

        {/* 体重・NOTE */}
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            {item.type === 'weight' && item.weightKg ? (
              <>
                <p className="text-base font-semibold text-foreground">{item.weightKg}kg</p>
                {item.note ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.note}</p>
                ) : null}
              </>
            ) : item.note ? (
              <p className="text-sm leading-6 text-foreground">{item.note}</p>
            ) : null}
          </div>

          {/* 写真 */}
          {item.photos.length > 0 ? (
            <div className="shrink-0 self-start">
              <button
                type="button"
                className="flex h-12 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground md:h-12 md:w-14"
                onClick={() => onOpenPhoto(item.photos[0])}
                aria-label="写真を拡大"
              >
                写真
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
