import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchLogs } from '@/lib/api/logsApi'
import { jst } from '@/lib/date'
import {
  addDaysIsoJst,
  buildDailyTotals,
  calcThisWeekTotalInsight,
  getWeekStartIsoJst,
} from '@/lib/resources/metricsResource'
import { logsQueryKey, monthOf } from '@/lib/resources/logsQuery'

import type { LogItem } from '@/types/logs'
import type { ThisWeekTotal } from '@/lib/resources/metricsResource'

/**
 * 今週（月〜日）の合計gを返すHook。
 * 週が月をまたぐ場合に備えて、必要な月ログを最大2ヶ月分だけ取得する。
 */

/**
 * 今週（月〜日）の合計gを返す。
 */
export function useThisWeekTotal(): ThisWeekTotal {
  // 今日（JST）
  const todayIso = jst().format('YYYY-MM-DD')

  // 今週の開始（月曜）
  const weekStart = getWeekStartIsoJst(todayIso)

  // 今週の終了（日曜）
  const weekEnd = addDaysIsoJst(weekStart, 6)

  // 取得対象の月（週が別月になるケースに対応）
  const months = Array.from(new Set([monthOf(weekStart), monthOf(weekEnd)]))

  // 月ごとのログを取得（monthsの順で結果が返る）
  const results = useSuspenseQueries({
    queries: months.map((m) => ({
      // m = "YYYY-MM"
      queryKey: logsQueryKey(m),
      queryFn: () => fetchLogs(m),
    })),
  })

  // 月ごとの配列を結合して、週計算に使う1つの配列にまとめる
  const logs: LogItem[] = results.flatMap((r) => r.data)

  // 日別合計（key=YYYY-MM-DD, value=その日の合計g）
  const dailyTotals = buildDailyTotals(
    logs.map((x) => ({
      recordedAtIso: x.recordedAtIso,
      grams: x.grams,
    }))
  )

  // 今週（月〜日）の合計gを返す
  return calcThisWeekTotalInsight({
    todayIso,
    dailyTotals,
  })
}
