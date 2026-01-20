import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isoWeek from 'dayjs/plugin/isoWeek'

// UTC/タイムゾーン/ISO週の機能を使うために拡張を適用する
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)

/**
 * @description 入力日時をJSTのdayjsオブジェクトに変換して返す。
 * @param input 変換対象の日時（未指定時は現在時刻）
 * @returns JSTに変換されたdayjsオブジェクト
 */
export const jst = (input?: string | Date) => dayjs(input).tz('Asia/Tokyo')

export default dayjs
