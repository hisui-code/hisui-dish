import { FaFish, FaPaw } from 'react-icons/fa'
import type { DashboardMergedData } from '@/hooks/useDashboardData'

function Stat({
  icon,
  label,
  value,
  unit,
  color,
  subText,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  color?: string
  subText?: string
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_6px_18px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-neutral-600">
        {icon}
        <span>{label}</span>
      </div>

      <div className="mt-1.5 flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1">
            <div
              className="text-3xl font-semibold tracking-tight"
              style={{ color: color ?? `#0b0b0c` }}
            >
              {value}
            </div>
            {unit && <div className="text-sm text-neutral-500">{unit}</div>}
          </div>

          {subText && <div className="mt-1 text-xs text-neutral-500">{subText}</div>}
        </div>
      </div>
    </div>
  )
}

type KpisProps = {
  data: Pick<
    DashboardMergedData,
    | 'todayTotal'
    | 'bowlRemaining'
    | 'averageDailyIntakeLast3Months'
    | 'thisWeekTotalGrams'
    | 'thisMonthTotalGrams'
    | 'thisMonthDiffGrams'
    | 'thisMonthDiffPct'
  >
}

export default function Kpis({ data }: KpisProps) {
  const monthDiffSign = data.thisMonthDiffGrams >= 0 ? '+' : ''
  const monthDiffPctLabel =
    data.thisMonthDiffPct == null
      ? '—'
      : `${monthDiffSign}${Math.round(data.thisMonthDiffPct * 100)}%`
  const monthSubText = `前月比 ${monthDiffSign}${Math.round(data.thisMonthDiffGrams)}g (${monthDiffPctLabel})`

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
      />
    </div>
  )
}
