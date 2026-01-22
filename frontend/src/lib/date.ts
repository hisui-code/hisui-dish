import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isoWeek from 'dayjs/plugin/isoWeek'

// UTC/タイムゾーン/ISO週の機能を使うために拡張を適用する
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)

/**
 * @description 入力日時をJSTのdayjsオブジェクトに変換して返す
 * @param input 変換対象の日時（未指定時は現在時刻）
 * @returns JSTに変換されたdayjsオブジェクト
 */
export const jst = (input?: string | Date) => dayjs(input).tz('Asia/Tokyo')

/**
 * @description JSTの指定日(YYYY-MM-DD)の00:00をdayjsとして生成する
 * タイムゾーン情報なし文字列の解釈ブレを避けるため dayjs.tz でJSTとしてパースする
 * @param isoDate 日付（YYYY-MM-DD）
 * @returns JSTの00:00のdayjsオブジェクト
 */
export const jstMidnight = (isoDate: string) => dayjs.tz(`${isoDate}T00:00:00`, 'Asia/Tokyo')

export default dayjs
