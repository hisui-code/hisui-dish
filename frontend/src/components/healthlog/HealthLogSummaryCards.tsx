import { Card, CardContent } from '@/components/ui/card'
import { FaCalendarAlt } from 'react-icons/fa'
import { FaWeightScale, FaNotesMedical } from 'react-icons/fa6'

type HealthLogSummaryCardsProps = {
  /** 今月の記録回数 */
  monthlyLogCount: number
  /** 最終通院日の日付表示 */
  latestHospitalVisitDate: string
  /** 最新体重の表示値 */
  latestWeightValue: string
  /** 最新体重の計測日表示 */
  latestWeightDate: string
}

/**
 * @description 健康記録ページ上部のサマリーカード群を表示する
 */
export default function HealthLogSummaryCards({
  monthlyLogCount,
  latestHospitalVisitDate,
  latestWeightValue,
  latestWeightDate,
}: HealthLogSummaryCardsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {/* 今月の記録回数 */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <FaCalendarAlt className="h-3.5 w-3.5" />
            <span>今月の記録回数</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-semibold text-foreground">{monthlyLogCount}件</p>
          </div>
        </CardContent>
      </Card>

      {/* 最終通院日 */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <FaNotesMedical className="h-3.5 w-3.5" />
            <span>最終通院日</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-semibold text-foreground">{latestHospitalVisitDate}</p>
          </div>
        </CardContent>
      </Card>

      {/* 最新の体重 */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <FaWeightScale className="h-3.5 w-3.5" />
            <span>体重</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              ({latestWeightDate})
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-semibold text-foreground">{latestWeightValue}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
