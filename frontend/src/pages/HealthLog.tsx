import { PageHeader } from '@/components/layout/PageHeader'
import { BsFillHeartPulseFill } from 'react-icons/bs'

/**
 * @description 健康記録ページの骨組みを表示する
 */
export default function HealthLog() {
  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <PageHeader icon={<BsFillHeartPulseFill className="h-5 w-5" />} title="健康記録" />

        <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          健康記録ページを準備中です
        </div>
      </div>
    </div>
  )
}
