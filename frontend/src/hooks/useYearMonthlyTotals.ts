import { useSuspenseQueries } from '@tanstack/react-query'
import { fetchLogs } from '@/lib/api/logsApi'
import { logsQueryKey } from '@/lib/resources/logsQuery'

import type { LogItem } from '@/types/logs'

/**
 * @description
 * 年別の「月ごとの合計（1〜12月）」をグラフ表示するための最小行
 */
export type YearMonthlyTotalsRow = {
  /** @description 表示用の月ラベル（"1"〜"12"） */
  monthLabel: string
  /** @description 月の合計（g） */
  totalGrams: number
}

/**
 * @description
 * 指定年の「月ごとの合計（1〜12月）」を返すHook
 *
 * @param year - 対象年（"YYYY"）
 * @returns 月別合計の配列（12件）
 */
export function useYearMonthlyTotals(year: string): YearMonthlyTotalsRow[] {
  /**
   * @description
   * 取得対象の月キー配列（"YYYY-MM"）
   * APIの `month` クエリにそのまま渡す
   */
  const months = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    return `${year}-${mm}`
  })

  /**
   * @description
   * 12ヶ月分を取得する
   */
  const results = useSuspenseQueries({
    queries: months.map((m) => ({
      queryKey: logsQueryKey(m),
      queryFn: () => fetchLogs(m),
    })),
  })

  /**
   * @description
   * 月別合計（g）に変換する
   */
  return results.map((r, idx) => {
    const month = months[idx]
    const logs = r.data as LogItem[]

    let total = 0
    for (const x of logs) {
      if (x.recordedAtIso.slice(0, 7) !== month) continue
      total += x.grams
    }

    return {
      monthLabel: String(idx + 1),
      totalGrams: total,
    }
  })
}
