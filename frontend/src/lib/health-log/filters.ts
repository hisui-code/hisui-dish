import type { HealthLogFilterType, HealthLogRecord } from '@/types/healthLog'

/**
 * @description 健康記録一覧へ種別フィルターを適用する
 */
export function filterHealthLogsByType(
  logs: HealthLogRecord[],
  selectedType: HealthLogFilterType
): HealthLogRecord[] {
  if (selectedType === 'all') {
    return logs
  }

  return logs.filter((log) => log.type === selectedType)
}
