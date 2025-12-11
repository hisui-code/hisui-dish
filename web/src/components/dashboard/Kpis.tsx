import { FaFish, FaPaw } from 'react-icons/fa'
import type { DashboardData } from '@/types/dashboard'

function Stat({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  color?: string
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_6px_18px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-neutral-600">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 flex-1 flex items-center justify-center">
        <div className="flex items-baseline justify-center gap-1">
          <div
            className="text-3xl font-semibold tracking-tight"
            style={{ color: color ?? `#0b0b0c` }}
          >
            {value}
          </div>
          {unit && <div className="text-sm text-neutral-500">{unit}</div>}
        </div>
      </div>
    </div>
  )
}

type KpisProps = {
  data: Pick<DashboardData, 'todayTotal' | 'bowlRemaining'>
}

export default function Kpis({ data }: KpisProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
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
        value={0}
        unit="g"
        color="#14b8a6"
      />
      <div className="hidden md:block"></div>
    </div>
  )
}
