import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import { useThisWeekTotal } from '@/hooks/dashboard/useThisWeekTotal'
import { useMonthTotalVsPrev } from '@/hooks/dashboard/useMonthTotalVsPrev'
import { queryKeys } from '@/lib/queryKeys'
import { jst } from '@/lib/date'

import type { DashboardData } from '@/types/dashboard'

/**
 * @description Dashboard APIの基本データに、画面表示で使う月次週次メトリクスを合成した型
 */
export type DashboardMergedData = DashboardData & {
  /** @description 今週の合計g */
  thisWeekTotalGrams: number
  /** @description 今月の合計g */
  thisMonthTotalGrams: number
  /** @description 前月比の差分g */
  thisMonthDiffGrams: number
  /** @description 前月比の差分率 前月データが0の場合はnull */
  thisMonthDiffPct: number | null
}

/**
 * @description ダッシュボード表示に必要な集計値を取得し、追加メトリクスを合成して返す
 * APIのベースデータに今週合計と今月前月比を加えてPageが直接使える形にする
 * @returns ダッシュボード表示用の合成データ
 */
export function useDashboardData(): DashboardMergedData {
  // キャッシュキーとAPIクエリを当月単位でそろえる
  const month = jst().format('YYYY-MM')
  // 当日は再取得タイミング制御に使う
  const todayJst = jst().format('YYYY-MM-DD')

  const { data } = useSuspenseQuery<DashboardData>({
    queryKey: queryKeys.dashboard(month, todayJst),
    queryFn: () => fetchDashboard(month),
  })

  // 今週合計メトリクスを取得する
  const thisWeekTotal = useThisWeekTotal()

  // 今月合計と前月比メトリクスを取得する
  const monthVsPrev = useMonthTotalVsPrev()

  // API基本データへ追加メトリクスを合成して返す
  return {
    ...data,
    thisWeekTotalGrams: thisWeekTotal.weekTotalGrams,
    thisMonthTotalGrams: monthVsPrev.monthTotalGrams,
    thisMonthDiffGrams: monthVsPrev.diffGrams,
    thisMonthDiffPct: monthVsPrev.diffPct,
  }
}
