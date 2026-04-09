import { useState } from 'react'
import { formatHealthLogDate, jst } from '@/lib/date'
import { mockHealthLogs } from '@/lib/health-log/mock'
import type { HealthLogFilterType } from '@/types/healthLog'

type UseHealthLogPageResult = {
  /** 現在選択中の種別 */
  selectedType: HealthLogFilterType
  /** 現在選択中の年月 */
  selectedMonth: string
  /** 種別変更時の処理 */
  setSelectedType: (value: HealthLogFilterType) => void
  /** 年月変更時の処理 */
  setSelectedMonth: (value: string) => void
  /** フィルター適用後の健康記録一覧 */
  filteredLogs: typeof mockHealthLogs
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
 * @description 健康記録ページのフィルター状態とサマリー・一覧表示に使う値をまとめる
 */
export function useHealthLogPage(): UseHealthLogPageResult {
  const latestHospitalVisit = mockHealthLogs.find((log) => log.type === 'hospital_visit')
  const latestWeight = mockHealthLogs.find((log) => log.type === 'weight')

  const [selectedType, setSelectedType] = useState<HealthLogFilterType>('all')
  const [selectedMonth, setSelectedMonth] = useState(jst().format('YYYY-MM'))

  // 一覧表示に使うため、種別と年月の両方で絞り込む
  const filteredLogs = mockHealthLogs.filter((log) => {
    const matchesType = selectedType === 'all' || log.type === selectedType
    const matchesMonth = jst(log.occurredAt).format('YYYY-MM') === selectedMonth

    return matchesType && matchesMonth
  })

  const monthlyLogCount = filteredLogs.length
  const latestHospitalVisitDate = formatHealthLogDate(latestHospitalVisit?.occurredAt)
  const latestWeightDate = formatHealthLogDate(latestWeight?.occurredAt)
  const latestWeightValue = latestWeight?.weightKg ? `${latestWeight.weightKg}kg` : '-'

  return {
    selectedType,
    setSelectedType,
    selectedMonth,
    setSelectedMonth,
    filteredLogs,
    monthlyLogCount,
    latestHospitalVisitDate,
    latestWeightDate,
    latestWeightValue,
  }
}
