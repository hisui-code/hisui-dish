import { jst } from '../date'

/**
 * インサイト集計用のユーティリティ
 */

export type InsightLogLite = {
  recordedAtIso: string
  grams: number
}

/**
 * 「今日の合計」と「前週(月〜日)の1日平均」を比較するための表示用データ。
 */
export type TodayVsPrevWeekInsight = {
  todayIso: string
  todayTotalGrams: number

  prevWeekStartIso: string
  prevWeekEndIso: string
  prevWeekAvgPerDayGrams: number

  diffGrams: number
  diffPct: number | null
}

/**
 * ログ配列から「日別合計(g)」を作る。
 * 返り値: key=YYYY-MM-DD, value=その日の合計g
 */
export function buildDailyTotals(logs: InsightLogLite[]): Map<string, number> {
  const map = new Map<string, number>()

  //recordedAtIso が +09:00 を含む想定なので slice(0,10) でJST日付キーが安定する
  for (const x of logs) {
    const dayKey = x.recordedAtIso.slice(0, 10)
    map.set(dayKey, (map.get(dayKey) ?? 0) + x.grams)
  }
  return map
}

/**
 * 指定日の「週の開始日(月曜)」を YYYY-MM-DD で返す
 * isoWeek(月曜始まり) を使う。
 */
export function getWeekStartIsoJst(isoDate: string): string {
  return jst(`${isoDate}T00:00:00`).startOf('isoWeek').format('YYYY-MM-DD')
}

/**
 * YYYY-MM-DD に日数を加算/減算して YYYY-MM-DD を返す。
 */
export function addDaysIsoJst(isoDate: string, days: number): string {
  return jst(`${isoDate}T00:00:00`).add(days, 'day').format('YYYY-MM-DD')
}

/**
 * 今日の合計gと、前週(月〜日)の1日平均gを計算して比較結果を返す。
 * - 前週にログがない日は 0g として平均に含める
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
 * 今週（月〜日）の合計gを表示するためのデータ。
 */
export type ThisWeekTotalInsight = {
  weekStartIso: string
  weekEndIso: string
  weekTotalGrams: number
}

/**
 * 日別合計Mapから「今週（月〜日）の合計g」を計算して返す。
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
