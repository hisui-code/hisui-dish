import type { TodayEvent } from '@/types/dashboard'

type Props = {
  events: TodayEvent[]
}

export default function TodayList({ events }: Props) {
  const total = events.reduce((s, e) => s + e.g, 0)
  return (
    <div className="mt-6 rounded-3xl bg-white ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-[15px] font-medium text-neutral-800">🍽️ 今日の記録</h3>
        <div className="text-xs text-neutral-500">{events.length}回</div>
      </div>
      <ul className="divide-y divide-neutral-100">
        {events.map((e, i) => (
          <li key={`${e.time}-${i}`} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">⏰</span>
              <span className="font-medium tabular-nums">{e.time}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold tabular-nums">{e.g.toFixed(1)}</span>
              <span className="text-xs text-neutral-500">g</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-b-3xl bg-neutral-50 px-4 text-xs text-neutral-500">
        合計 {total.toFixed(1)} g
      </div>
    </div>
  )
}
