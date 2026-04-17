import { Card, CardContent } from '@/components/ui/card'
import type { HealthLogRecord } from '@/types/healthLog'
import HealthLogTimelineItem from './HealthLogTimelineItem'

type HealthLogTimelineProps = {
  /** @description 表示対象の健康記録一覧 */
  logs: HealthLogRecord[]
  /** @description 編集ボタン押下時の処理 */
  onEdit: (item: HealthLogRecord) => void
  /** 写真押下時の処理 */
  onOpenPhoto: (photo: string) => void
}

/**
 * @description 健康記録一覧をタイムライン形式で表示する
 */
export default function HealthLogTimeline({ logs, onEdit, onOpenPhoto }: HealthLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-base font-semibold text-foreground">条件に一致する記録がありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section>
      {logs.map((item, index) => (
        <HealthLogTimelineItem
          key={item.id}
          item={item}
          onEdit={onEdit}
          onOpenPhoto={onOpenPhoto}
          isLast={index === logs.length - 1}
        />
      ))}
    </section>
  )
}
