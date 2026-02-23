import type { ReactNode } from 'react'
import { FiArrowDown, FiArrowUp } from 'react-icons/fi'
import { FaFish, FaPaw } from 'react-icons/fa'
import type { DashboardKpisViewModel } from '@/hooks/dashboard/useDashboardPage'

type KpisProps = {
  data: DashboardKpisViewModel
}

type StatProps = {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  color?: string
  subText?: string
  rightIcon?: ReactNode
}

type MonthTrendViewModel = {
  subText: string
  icon: ReactNode | null
}

/**
 * @description KPIカード1枚分の表示
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

/**
 * @description 前月比表示をKPI表示用に整形する
 */
function buildMonthTrendViewModel(diffGrams: number, diffPct: number | null): MonthTrendViewModel {
  // 差分表示の符号
  const sign = diffGrams >= 0 ? '+' : ''
  // 前月のデータがなければ'—'
  const pctLabel = diffPct == null ? '—' : `${sign}${Math.round(diffPct * 100)}%`
  // 表示用
  const subText = `前月比 ${sign}${Math.round(diffGrams)}g (${pctLabel})`
  // 差分の矢印
  const icon =
    diffGrams > 0 ? (
      <FiArrowUp className="h-4 w-4 text-emerald-600" aria-label="前月より増" />
    ) : diffGrams < 0 ? (
      <FiArrowDown className="h-4 w-4 text-rose-600" aria-label="前月より減" />
    ) : null

  return { subText, icon }
}

/**
 * @description ダッシュボードの KPIを表示する
 */
export default function Kpis({ data }: KpisProps) {
  // 補足表示 前月比
  const monthTrend = buildMonthTrendViewModel(data.thisMonthDiffGrams, data.thisMonthDiffPct)

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
        subText={monthTrend.subText}
        rightIcon={monthTrend.icon}
      />
    </div>
  )
}
