import { jst } from '../date'

/**
 * @description
 * インサイト集計用のユーティリティ群
 *
 * - 日付キーは `YYYY-MM-DD`（JST基準）で扱う
 * - 週は `isoWeek`（月曜始まり）で扱う
 * - 重量の単位はすべて g（グラム）
 */

/**
 * @description
 * インサイト計算に必要な最小のログ表現
 * `recordedAtIso` は `+09:00` を含む ISO 文字列を想定し、
 * `slice(0, 10)` で JST 日付（YYYY-MM-DD）キーが安定する前提
 */
export type InsightLogLite = {
  /** @description 記録時刻（ISO文字列、例: "2025-12-24T10:11:12+09:00"） */
  recordedAtIso: string
  /** @description 記録量（g）減少量の合計を扱う想定 */
  grams: number
}

/**
 * @description
 * 「今日の合計」と「前週（月〜日）の1日平均」を比較するための表示用データ
 *
 * - `diffGrams` は `todayTotalGrams - prevWeekAvgPerDayGrams`
 * - `diffPct` は `diffGrams / prevWeekAvgPerDayGrams`
 *   - 前週平均が 0 の場合は `null`
 */
export type TodayVsPrevWeekInsight = {
  /** @description 対象日（YYYY-MM-DD, JST） */
  todayIso: string
  /** @description 今日の合計（g） */
  todayTotalGrams: number

  /** @description 前週の開始日（月曜, YYYY-MM-DD, JST） */
  prevWeekStartIso: string
  /** @description 前週の終了日（日曜, YYYY-MM-DD, JST） */
  prevWeekEndIso: string
  /** @description 前週（月〜日）の 1 日平均（g）ログ無し日は 0 として平均に含める */
  prevWeekAvgPerDayGrams: number

  /** @description 差分（g）`todayTotalGrams - prevWeekAvgPerDayGrams` */
  diffGrams: number
  /** @description 差分率`diffGrams / prevWeekAvgPerDayGrams`前週平均が0なら null */
  diffPct: number | null
}

/**
 * @description
 * ログ配列から「日別合計(g)」を作る
 *
 * - key: `YYYY-MM-DD`（JST基準）
 * - value: その日の合計（g）
 *
 * `recordedAtIso` が `+09:00` を含む想定なので `slice(0, 10)` で JST 日付キーが安定する
 *
 * @param logs - 集計対象ログ配列（最小表現）
 * @returns 日別合計Map（key=YYYY-MM-DD, value=合計g）
 */
export function buildDailyTotals(logs: InsightLogLite[]): Map<string, number> {
  const map = new Map<string, number>()

  // recordedAtIso が +09:00 を含む想定なので slice(0,10) でJST日付キーが安定する
  for (const x of logs) {
    const dayKey = x.recordedAtIso.slice(0, 10)
    map.set(dayKey, (map.get(dayKey) ?? 0) + x.grams)
  }
  return map
}

/**
 * @description
 * 指定日の「週の開始日（月曜）」を `YYYY-MM-DD`（JST）で返す
 * `isoWeek`（月曜始まり）を使用する
 *
 * @param isoDate - 対象日（YYYY-MM-DD）
 * @returns 週の開始日（月曜, YYYY-MM-DD, JST）
 */
export function getWeekStartIsoJst(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).startOf('isoWeek').format('YYYY-MM-DD')
}

/**
 * @description
 * `YYYY-MM-DD` に日数を加算/減算して `YYYY-MM-DD`（JST）を返す
 *
 * @param isoDate - 基準日（YYYY-MM-DD）
 * @param days - 加算日数（負数で減算）
 * @returns 計算後の日付（YYYY-MM-DD, JST）
 */
export function addDaysIsoJst(isoDate: string, days: number): string {
  return jst(`${isoDate}T00:00:00`).add(days, 'day').format('YYYY-MM-DD')
}

/**
 * @description
 * 今日の合計(g)と、前週（月〜日）の1日平均(g)を計算して比較結果を返す
 *
 * - 前週にログがない日も `0g` として平均に含める（平均値を安定させるため）
 * - `dailyTotals` の key は `YYYY-MM-DD`（JST）を想定
 *
 * @param args - 入力
 * @param args.todayIso - 今日（YYYY-MM-DD, JST）
 * @param args.dailyTotals - 日別合計Map（key=YYYY-MM-DD, value=合計g）
 * @returns 比較用データ（今日合計・前週平均・差分/差分率）
 */
export function calcTodayVsPrevWeekInsight(args: {
  todayIso: string
  dailyTotals: Map<string, number>
}): TodayVsPrevWeekInsight {
  const { todayIso, dailyTotals } = args

  const todayTotal = dailyTotals.get(todayIso) ?? 0

  const thisWeekStart = getWeekStartIsoJst(todayIso)
  const prevWeekStart = addDaysIsoJst(thisWeekStart, -7)
  const prevWeekEnd = addDaysIsoJst(prevWeekStart, 6)

  let prevWeekTotal = 0
  for (let i = 0; i < 7; i++) {
    const k = addDaysIsoJst(prevWeekStart, i)

    // ログがない日も 0g として平均に含め、前週の1日平均を安定させる
    prevWeekTotal += dailyTotals.get(k) ?? 0
  }

  const prevWeekAvg = prevWeekTotal / 7
  const diff = todayTotal - prevWeekAvg
  const diffPct = prevWeekAvg > 0 ? diff / prevWeekAvg : null

  return {
    todayIso,
    todayTotalGrams: todayTotal,
    prevWeekStartIso: prevWeekStart,
    prevWeekEndIso: prevWeekEnd,
    prevWeekAvgPerDayGrams: prevWeekAvg,
    diffGrams: diff,
    diffPct,
  }
}

/**
 * @description
 * 今週（月〜日）の合計gを表示するためのデータ
 * `isoWeek`（月曜始まり）を前提にする
 */
export type ThisWeekTotalInsight = {
  /** @description 週の開始日（月曜, YYYY-MM-DD, JST） */
  weekStartIso: string
  /** @description 週の終了日（日曜, YYYY-MM-DD, JST） */
  weekEndIso: string
  /** @description 週の合計（g） */
  weekTotalGrams: number
}

/**
 * @description
 * 日別合計Mapから「今週（月〜日）の合計g」を計算して返す
 *
 * - ログがない日も `0g` として合計に含める
 * - `dailyTotals` の key は `YYYY-MM-DD`（JST）を想定
 *
 * @param args - 入力
 * @param args.todayIso - 今日（YYYY-MM-DD, JST）
 * @param args.dailyTotals - 日別合計Map（key=YYYY-MM-DD, value=合計g）
 * @returns 今週合計表示用データ
 */
export function calcThisWeekTotalInsight(args: {
  todayIso: string
  dailyTotals: Map<string, number>
}): ThisWeekTotalInsight {
  const { todayIso, dailyTotals } = args
  const weekStart = getWeekStartIsoJst(todayIso)
  const weekEnd = addDaysIsoJst(weekStart, 6)

  let total = 0
  for (let i = 0; i < 7; i++) {
    const k = addDaysIsoJst(weekStart, i)
    total += dailyTotals.get(k) ?? 0
  }

  return {
    weekStartIso: weekStart,
    weekEndIso: weekEnd,
    weekTotalGrams: total,
  }
}

/**
 * @description
 * 月の合計gを表示するためのデータ
 */
export type MonthTotalInsight = {
  /** @description 対象月（"YYYY-MM"） */
  month: string
  /** @description 月の合計（g） */
  monthTotalGrams: number
}

/**
 * @description
 * 指定月のログから「月の合計g」を計算して返す
 *
 * - 月判定は `recordedAtIso.slice(0, 7) === month` による
 * - `recordedAtIso` は ISO 文字列を想定（先頭7文字が "YYYY-MM"）
 *
 * @param args - 入力
 * @param args.month - 対象月（"YYYY-MM"）
 * @param args.logs - ログ配列
 * @returns 月合計表示用データ
 */
export function calcMonthTotalInsight(args: {
  month: string
  logs: InsightLogLite[]
}): MonthTotalInsight {
  const { month, logs } = args

  let total = 0
  for (const x of logs) {
    if (x.recordedAtIso.slice(0, 7) !== month) continue
    total += x.grams
  }

  return {
    month,
    monthTotalGrams: total,
  }
}

/**
 * @description
 * 今月合計と前月合計を比較するためのデータ
 *
 * - `diffGrams` は `monthTotalGrams - prevMonthTotalGrams`
 * - `diffPct` は `diffGrams / prevMonthTotalGrams`
 *   - 前月合計が 0 の場合は `null`
 */
export type MonthTotalVsPrevInsight = {
  /** @description 対象月（"YYYY-MM"） */
  month: string
  /** @description 対象月の合計（g） */
  monthTotalGrams: number

  /** @description 前月（"YYYY-MM"） */
  prevMonth: string
  /** @description 前月の合計（g） */
  prevMonthTotalGrams: number

  /** @description 差分（g）`monthTotalGrams - prevMonthTotalGrams` */
  diffGrams: number
  /** @description 差分率`diffGrams / prevMonthTotalGrams`前月合計が0なら null */
  diffPct: number | null
}

/**
 * @description
 * 指定月ログの合計gを返す（集計の共通処理）
 *
 * - 月判定は `recordedAtIso.slice(0, 7) === month` による
 * - `recordedAtIso` は ISO 文字列を想定（先頭7文字が "YYYY-MM"）
 *
 * @param args - 入力
 * @param args.month - 対象月（"YYYY-MM"）
 * @param args.logs - ログ配列
 * @returns 対象月の合計（g）
 */
export function calcMonthTotalGrams(args: { month: string; logs: InsightLogLite[] }): number {
  const { month, logs } = args

  let total = 0
  for (const x of logs) {
    if (x.recordedAtIso.slice(0, 7) !== month) continue
    total += x.grams
  }

  return total
}

/**
 * @description
 * 今月合計と前月合計を計算して比較結果を返す
 *
 * - `diffPct` は前月合計が 0 の場合 `null`
 *
 * @param args - 入力
 * @param args.month - 対象月（"YYYY-MM"）
 * @param args.monthLogs - 対象月ログ配列
 * @param args.prevMonth - 前月（"YYYY-MM"）
 * @param args.prevMonthLogs - 前月ログ配列
 * @returns 月次比較表示用データ（今月/前月/差分/差分率）
 */
export function calcMonthTotalVsPrevInsight(args: {
  month: string
  monthLogs: InsightLogLite[]
  prevMonth: string
  prevMonthLogs: InsightLogLite[]
}): MonthTotalVsPrevInsight {
  const { month, monthLogs, prevMonth, prevMonthLogs } = args

  const monthTotal = calcMonthTotalGrams({ month, logs: monthLogs })
  const prevTotal = calcMonthTotalGrams({ month: prevMonth, logs: prevMonthLogs })

  const diff = monthTotal - prevTotal
  const diffPct = prevTotal > 0 ? diff / prevTotal : null

  return {
    month,
    monthTotalGrams: monthTotal,
    prevMonth,
    prevMonthTotalGrams: prevTotal,
    diffGrams: diff,
    diffPct,
  }
}

export type WeeklyTotalRow = {
  weekStartIso: string
  weekLabel: string
  totalGrams: number
}

/**
 * @description
 * 指定日の「iso週キー」を返す
 * 表示や集計のグループキー用途で使う
 *
 * @param isoDate - 対象日（YYYY-MM-DD）
 * @returns 週キー（例 "2025-W03"）
 */
export function getIsoWeekKeyJst(isoDate: string): string {
  const d = jst(`${isoDate}T00:00:00`)
  const y = d.isoWeekYear()
  const w = String(d.isoWeek()).padStart(2, '0')
  return `${y}-W${w}`
}

/**
 * @description
 * 週ラベルを返す
 * 開始日を基準にした表示にする
 *
 * @param weekStartIso - 週の開始日（月曜 YYYY-MM-DD）
 * @returns 表示用ラベル（例 "12/02"）
 */
export function formatWeekLabel(weekStartIso: string): string {
  return jst(`${weekStartIso}T00:00:00`).format('MM/DD')
}

/**
 * @description
 * 指定した週開始日からN週分の「週別合計」を作る
 *
 * - 週は isoWeek（月曜始まり）
 * - ログがない週も 0g を入れて配列長を安定させる
 *
 * @param args - 入力
 * @param args.weekStartIso - 先頭週の開始日（月曜 YYYY-MM-DD）
 * @param args.weeks - 週数（例 8）
 * @param args.dailyTotals - 日別合計Map（key=YYYY-MM-DD, value=合計g）
 * @returns 週別合計配列（週数ぶん）
 */
export function buildWeeklyTotals(args: {
  weekStartIso: string
  weeks: number
  dailyTotals: Map<string, number>
}): WeeklyTotalRow[] {
  const { weekStartIso, weeks, dailyTotals } = args
  const rows: WeeklyTotalRow[] = []

  for (let w = 0; w < weeks; w++) {
    const start = jst(`${weekStartIso}T00:00:00`)
      .add(w * 7, 'day')
      .format('YYYY-MM-DD')

    let total = 0
    for (let i = 0; i < 7; i++) {
      const dayKey = jst(`${start}T00:00:00`)
        .add(w * 7, 'day')
        .format('YYYY-MM-DD')
      total += dailyTotals.get(dayKey) ?? 0
    }

    rows.push({
      weekStartIso: start,
      weekLabel: formatWeekLabel(start),
      totalGrams: total,
    })
  }

  return rows
}
