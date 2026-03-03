import { useMemo, useState } from 'react'
import { jst } from '@/lib/date'
import { getWeekStartIsoJst } from '@/lib/resources/metricsResource'

const WEEKS = 6

/**
 * @description Dashboardの月表示状態
 */
export type DashboardStateMonthly = {
  /** @description 選択中の対象月（YYYY-MM） */
  month: string
  /** @description 対象月を更新する */
  setMonth: (next: string) => void
}

/**
 * @description Dashboardの週表示状態
 */
export type DashboardStateWeekly = {
  /** @description 表示先頭週（月曜, YYYY-MM-DD） */
  weekStartIso: string
  /** @description 期間ラベル（例: 02/03の週〜03/10の週） */
  rangeLabel: string
  /** @description 次期間へ進めるかどうか */
  canNext: boolean
  /** @description 表示期間を過去へ移動する */
  onPrev: () => void
  /** @description 表示期間を未来へ移動する */
  onNext: () => void
}

/**
 * @description Dashboardの年表示状態
 */
export type DashboardStateYearMonthly = {
  /** @description 選択中の対象年（YYYY） */
  year: string
  /** @description 次の年へ進めるかどうか */
  canNext: boolean
  /** @description 前年へ移動する */
  onPrev: () => void
  /** @description 翌年へ移動する */
  onNext: () => void
}

/**
 * @description Dashboard画面の表示カーソル状態
 */
export type DashboardStateViewModel = {
  /** @description 月別チャートの表示状態 */
  monthly: DashboardStateMonthly
  /** @description 週別チャートの表示状態 */
  weekly: DashboardStateWeekly
  /** @description 年別チャートの表示状態 */
  yearMonthly: DashboardStateYearMonthly
}

/**
 * @description ISO日付(YYYY-MM-DD)をMM/DDへ整形する
 */
function formatMd(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).format('MM/DD')
}

/**
 * @description Dashboardの表示カーソル状態を管理する
 */
export function useDashboardState() {
  // 日別チャート用の対象月カーソル
  const [month, setMonth] = useState<string>(() => jst().format('YYYY-MM'))
  // 年別チャート用の対象年カーソル
  const [year, setYear] = useState<string>(() => jst().format('YYYY'))

  // 週次表示の基準となる今週月曜をJSTで求める
  const thisWeekStartIso = getWeekStartIsoJst(jst().format('YYYY-MM-DD'))
  // 週次チャートの表示開始週を保持する
  const [weekStartIso, setWeekStartIso] = useState<string>(() =>
    jst(`${thisWeekStartIso}T00:00:00`)
      .add(-(WEEKS - 1) * 7, 'day')
      .format('YYYY-MM-DD')
  )

  // 先頭週から6週間ぶんの「最新週の月曜」を計算する
  const latestWeekStartIso = useMemo(() => {
    return jst(`${weekStartIso}T00:00:00`)
      .add((WEEKS - 1) * 7, 'day')
      .format('YYYY-MM-DD')
  }, [weekStartIso])

  // ヘッダー表示用の期間ラベルを作る
  // 表示は「先頭週の月曜〜最新週の月曜」で統一する
  const weeklyRangeLabel = useMemo(() => {
    return `${formatMd(weekStartIso)}の週〜${formatMd(latestWeekStartIso)}の週`
  }, [weekStartIso, latestWeekStartIso])

  // 今週を超える未来期間には進ませない
  const weeklyCanNext = weekStartIso < thisWeekStartIso

  // 年別チャートは現在年を超えないよう制御する
  const currentYear = Number(jst().format('YYYY'))
  const yearCanNext = Number(year) < currentYear

  // 表示範囲を6週間ぶん過去へ移動する
  const onWeeklyPrev = () => {
    setWeekStartIso((prev) =>
      jst(`${prev}T00:00:00`)
        .add(-WEEKS * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }

  // 表示範囲を6週間ぶん未来へ移動する
  const onWeeklyNext = () => {
    // 未来期間に入る操作は無効化する
    if (!weeklyCanNext) return
    // 先頭週を6週間ぶん進めて表示期間を未来側へ移動する
    setWeekStartIso((prev) =>
      jst(`${prev}T00:00:00`)
        .add(WEEKS * 7, 'day')
        .format('YYYY-MM-DD')
    )
  }
  // 年カーソルを1年戻す
  const onYearPrev = () => {
    setYear(String(Number(year) - 1))
  }
  // 年カーソルを1年進める
  const onYearNext = () => {
    // 現在年より未来へは進ませない
    if (!yearCanNext) return
    setYear(String(Number(year) + 1))
  }

  return {
    monthly: {
      month,
      setMonth,
    },
    weekly: {
      weekStartIso,
      rangeLabel: weeklyRangeLabel,
      canNext: weeklyCanNext,
      onPrev: onWeeklyPrev,
      onNext: onWeeklyNext,
    },
    yearMonthly: {
      year,
      canNext: yearCanNext,
      onPrev: onYearPrev,
      onNext: onYearNext,
    },
  }
}
