import { formatHealthLogDate } from '@/lib/date'
import type { HealthLogRecord, HealthLogType } from '@/types/healthLog'

export type HealthLogSummary = {
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
 * @description 健康記録一覧からサマリーカード用の表示値を組み立てる
 */
export function buildHealthLogSummary(logs: HealthLogRecord[]): HealthLogSummary {
  const latestHospitalVisit = findLatestHealthLogByType(logs, 'hospital_visit')
  const latestWeight = findLatestHealthLogByType(logs, 'weight')

  return {
    monthlyLogCount: logs.length,
    latestHospitalVisitDate: formatHealthLogDate(latestHospitalVisit?.occurredAt),
    latestWeightDate: formatHealthLogDate(latestWeight?.occurredAt),
    latestWeightValue:
      typeof latestWeight?.weightKg === 'number' ? `${latestWeight.weightKg}kg` : '-',
  }
}

/**
 * @description 指定した種別の健康記録から発生日が最も新しい記録を取得する
 */
function findLatestHealthLogByType(
  logs: HealthLogRecord[],
  type: HealthLogType
): HealthLogRecord | undefined {
  return logs.reduce<HealthLogRecord | undefined>((latestLog, currentLog) => {
    if (currentLog.type !== type) {
      return latestLog
    }

    if (!latestLog) {
      return currentLog
    }

    return Date.parse(currentLog.occurredAt) > Date.parse(latestLog.occurredAt)
      ? currentLog
      : latestLog
  }, undefined)
}
