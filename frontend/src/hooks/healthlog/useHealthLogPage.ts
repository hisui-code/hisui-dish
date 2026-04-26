import { useState } from 'react'
import { formatHealthLogDate, jst } from '@/lib/date'
import type { HealthLogFilterType, HealthLogRecord } from '@/types/healthLog'
import { useHealthLogsQuery } from '@/hooks/healthlog/useHealthLogsQuery'

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
  filteredLogs: HealthLogRecord[]
  /** 今月の記録回数 */
  monthlyLogCount: number
  /** 最終通院日の日付表示 */
  latestHospitalVisitDate: string
  /** 最新体重の表示値 */
  latestWeightValue: string
  /** 最新体重の計測日表示 */
  latestWeightDate: string
  /** 一覧取得中かどうか */
  isLoading: boolean
  /** 一覧取得エラーメッセージ */
  errorMessage: string | null
}

/**
 * @description 健康記録ページのフィルター状態とサマリー・一覧表示に使う値をまとめる
 */
export function useHealthLogPage(): UseHealthLogPageResult {
  const [selectedType, setSelectedType] = useState<HealthLogFilterType>('all')
  const [selectedMonth, setSelectedMonth] = useState(jst().format('YYYY-MM'))

  const healthLogsQuery = useHealthLogsQuery(selectedMonth)
  const logs = healthLogsQuery.data ?? []

  // サマリーカードで使う直近の通院・体重記録を取得する
  const latestHospitalVisit = logs.find((log) => log.type === 'hospital_visit')
  const latestWeight = logs.find((log) => log.type === 'weight')

  // 種別フィルターはAPI再取得せず、取得済み一覧を画面側で絞り込む
  const filteredLogs = logs.filter((log) => {
    return selectedType === 'all' || log.type === selectedType
  })

  return {
    selectedType,
    setSelectedType,
    selectedMonth,
    setSelectedMonth,
    filteredLogs,
    monthlyLogCount: logs.length,
    latestHospitalVisitDate: formatHealthLogDate(latestHospitalVisit?.occurredAt),
    latestWeightDate: formatHealthLogDate(latestWeight?.occurredAt),
    latestWeightValue: latestWeight?.weightKg ? `${latestWeight.weightKg}kg` : '-',
    isLoading: healthLogsQuery.isPending,
    errorMessage: healthLogsQuery.error ? '健康記録の取得に失敗しました' : null,
  }
}
