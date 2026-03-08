import { useMemo } from 'react'
import { useSuspenseQueries } from '@tanstack/react-query'

import { fetchLogs } from '@/lib/api/logsApi'
import { logsQueryKey } from '@/lib/resources/logsQuery'
import { buildDailyTotals, buildWeeklyTotals } from '@/lib/resources/metricsResource'
import { jst } from '@/lib/date'

import type { LogItem } from '@/types/logs'
import type { WeeklyTotalRow } from '@/lib/resources/metricsResource'

/**
 * @description
 * 表示範囲に含まれる月キー配列を作る
 *
 * - APIが month 指定なので取得対象の月を列挙する
 * - startIso から endIso までの月を startOf('month') で走査する
 *
 * @param args - 入力
 * @param args.startIso - 範囲開始日（YYYY-MM-DD）
 * @param args.endIso - 範囲終了日（YYYY-MM-DD）
 * @returns 月キー配列（YYYY-MM）
 */
function buildMonthKeysInRange(args: { startIso: string; endIso: string }): string[] {
  const { startIso, endIso } = args

  const keys: string[] = []
  let cur = jst(`${startIso}T00:00:00`).startOf('month')
  const end = jst(`${endIso}T00:00:00`).startOf('month')

  // 開始月から終了月までを1ヶ月ずつ進めて取得対象を作る
  while (cur.isSame(end) || cur.isBefore(end)) {
    keys.push(cur.format('YYYY-MM'))
    cur = cur.add(1, 'month')
  }

  return keys
}

/**
 * @description
 * 指定した先頭週から N週ぶんの週別合計を返すHook
 *
 * - 表示範囲に必要な月のログだけを並列取得する
 * - 取得ログを範囲内だけに絞る
 * - 日別合計に変換してから週別合計へ変換する
 *
 * @param args - 入力
 * @param args.weekStartIso - 表示の先頭週の開始日（月曜 YYYY-MM-DD）
 * @param args.weeks - 表示する週数
 * @returns 週別合計配列（週数ぶん）
 */
export function useWeeklyTotalsMetrics(args: {
  weekStartIso: string
  weeks: number
}): WeeklyTotalRow[] {
  const { weekStartIso, weeks } = args

  /**
   * @description
   * 表示範囲の最終日（先頭週から weeks 週ぶんの最終日）
   */
  const endIso = useMemo(() => {
    return jst(`${weekStartIso}T00:00:00`)
      .add(weeks * 7 - 1, 'day')
      .format('YYYY-MM-DD')
  }, [weekStartIso, weeks])

  /**
   * @description
   * 表示範囲に必要な月キー
   */
  const monthKeys = useMemo(() => {
    return buildMonthKeysInRange({ startIso: weekStartIso, endIso })
  }, [weekStartIso, endIso])

  /**
   * @description
   * 月ごとのログを並列取得する
   * logsQueryKey を使うので Logs とキャッシュを共有できる
   */
  const results = useSuspenseQueries({
    queries: monthKeys.map((m) => ({
      queryKey: logsQueryKey(m),
      queryFn: () => fetchLogs(m),
    })),
  })

  /**
   * @description
   * 取得したログを表示範囲内に絞る
   * recordedAtIso は ISO 文字列想定なので slice(0,10) で日付キーにする
   */
  const logsInRange = useMemo(() => {
    const all: LogItem[] = []
    for (const r of results) {
      // 月ごとに取ったログをいったん1つにまとめる
      all.push(...(r.data as LogItem[]))
    }

    const start = weekStartIso
    const end = endIso

    return all.filter((x) => {
      const d = x.recordedAtIso.slice(0, 10)
      return d >= start && d <= end
    })
  }, [results, weekStartIso, endIso])

  /**
   * @description
   * 日別合計Mapに変換する
   * 週合計は日別合計を基に集計する
   */
  const dailyTotals = useMemo(() => {
    return buildDailyTotals(
      logsInRange.map((x) => ({
        // ログ一覧用のデータから日別集計に必要な形だけを取り出す
        recordedAtIso: x.recordedAtIso,
        grams: x.grams,
      }))
    )
  }, [logsInRange])

  /**
   * @description
   * 週別合計に変換して返す
   */
  return useMemo(() => {
    return buildWeeklyTotals({ weekStartIso, weeks, dailyTotals })
  }, [weekStartIso, weeks, dailyTotals])
}
