import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchLogs } from '@/lib/api/logsApi'
import { jst } from '@/lib/date'
import {
  addDaysIsoJst,
  buildDailyTotals,
  calcTodayVsPrevWeekInsight,
  getWeekStartIsoJst,
} from '@/lib/resources/insightsResource'

import type { LogItem } from '@/types/logs'
import type { TodayVsPrevWeekInsight } from '@/lib/resources/insightsResource'

/**
 * 「今日の合計」と「前週(月〜日)の1日平均」の比較データを返すHook。
 * 月またぎ（前週が別月）に備えて、必要な月ログを最大2ヶ月分だけ取得する。
 */

/**
 * React Query のキャッシュキー。
 * 月単位でログを共有する。
 */
const logsQueryKey = (month: string) => ['logs', month] as const

/**
 * YYYY-MM-DD → YYYY-MM。
 * APIが月指定なので、取得対象の月を作る。
 */
function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/**
 * インサイト用の比較データを返す。
 */
export function useTodayVsPrevWeekInsight(): TodayVsPrevWeekInsight {
  // 今日（JST）
  const todayIso = jst().format('YYYY-MM-DD')

  // 今週の開始（月曜）
  const thisWeekStart = getWeekStartIsoJst(todayIso)

  // 前週の開始（月曜）
  const prevWeekStart = addDaysIsoJst(thisWeekStart, -7)

  // 取得対象の月（前週が別月になるケースに対応）
  const months = Array.from(new Set([monthOf(todayIso), monthOf(prevWeekStart)]))

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

  // 今日の合計g と 前週(月〜日)の1日平均g を比較して返す
  return calcTodayVsPrevWeekInsight({
    todayIso,
    dailyTotals,
  })
}
