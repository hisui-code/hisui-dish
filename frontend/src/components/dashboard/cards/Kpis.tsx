import type { ReactNode } from 'react'
import { FiArrowDown, FiArrowUp } from 'react-icons/fi'
import { FaFish, FaPaw } from 'react-icons/fa'

import type { DashboardMergedData } from '@/hooks/dashboard/useDashboardData'

// ダッシュボード上部に並べる KPI カード群

/**
 * @description
 * Stat の入力
 */
type StatProps = {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  color?: string
  subText?: string
  rightIcon?: ReactNode
}

/**
 * @description
 * 1 枚の KPI 表示。
 * value と unit の右側に `rightIcon` を置けるようにして差分の方向を示す
 *
 * @param props - 入力
 * @param props.icon - 左側のアイコン
 * @param props.label - ラベル
 * @param props.value - 表示値
 * @param props.unit - 単位
 * @param props.color - value の色
 * @param props.subText - 補足テキスト
 * @param props.rightIcon - unit の右側に置く補助アイコン
 * @returns KPI 1 枚分の JSX
 */
function Stat({ icon, label, value, unit, color, subText, rightIcon }: StatProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_6px_18px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-neutral-600">
        {icon}
        <span>{label}</span>
      </div>

      <div className="mt-1.5 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1">
            <div
              className="text-3xl font-semibold tracking-tight"
              style={{ color: color ?? '#0b0b0c' }}
            >
              {value}
            </div>

            {unit && <div className="text-sm text-neutral-500">{unit}</div>}
            {rightIcon && <span className="ml-1 inline-flex items-center">{rightIcon}</span>}
          </div>

          {subText && <div className="mt-1 text-xs text-neutral-500">{subText}</div>}
        </div>
      </div>
    </div>
  )
}

// Kpis が使う値だけを Dashboard の戻り値から切り出す
type DashboardKpisData = Pick<
  DashboardMergedData,
  | 'todayTotal'
  | 'bowlRemaining'
  | 'averageDailyIntakeLast3Months'
  | 'thisWeekTotalGrams'
  | 'thisMonthTotalGrams'
  | 'thisMonthDiffGrams'
  | 'thisMonthDiffPct'
>

type KpisProps = {
  data: DashboardKpisData
}

/**
 * @description
 * ダッシュボードの KPI 群。
 *
 * @param props - 入力
 * @param props.data - ダッシュボード集計値（KPI 用に必要なもの）
 * @returns KPI 群の JSX
 */
export default function Kpis({ data }: KpisProps) {
  // 差分表示の符号
  const monthDiffSign = data.thisMonthDiffGrams >= 0 ? '+' : ''
  // 差分率 前月が 0 のときは計算できないので — にする
  const monthDiffPctLabel =
    data.thisMonthDiffPct == null
      ? '—'
      : `${monthDiffSign}${Math.round(data.thisMonthDiffPct * 100)}%`

  // 補足表示 前月比
  const monthSubText = `前月比 ${monthDiffSign}${Math.round(data.thisMonthDiffGrams)}g (${monthDiffPctLabel})`

  // 前月比がプラスなら上矢印 マイナスなら下矢印 0 は表示なし
  const monthTrendIcon =
    data.thisMonthDiffGrams > 0 ? (
      <FiArrowUp className="h-4 w-4 text-emerald-600" aria-label="前月より増" />
    ) : data.thisMonthDiffGrams < 0 ? (
      <FiArrowDown className="h-4 w-4 text-rose-600" aria-label="前月より減" />
    ) : null

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      <Stat
        icon={<FaPaw className="text-emerald-500" />}
        label="今日食べたごはん"
        value={data.todayTotal.toFixed(1)}
        unit="g"
        color="#14b8a6"
      />

      <Stat
        icon={<FaFish className="text-emerald-500" />}
        label="残りのごはん"
        value={data.bowlRemaining.toFixed(1)}
        unit="g"
        color="#14b8a6"
      />

      <Stat
        icon={<FaFish className="text-emerald-500" />}
        label="平均食事量"
        value={data.averageDailyIntakeLast3Months.toFixed(1)}
        unit="g"
        color="#14b8a6"
      />

      <Stat
        icon={<FaPaw className="text-emerald-500" />}
        label="今週の合計"
        value={Math.round(data.thisWeekTotalGrams)}
        unit="g"
        color="#14b8a6"
      />

      <Stat
        icon={<FaPaw className="text-emerald-500" />}
        label="今月の合計"
        value={Math.round(data.thisMonthTotalGrams)}
        unit="g"
        color="#14b8a6"
        subText={monthSubText}
        rightIcon={monthTrendIcon}
      />
    </div>
  )
}
