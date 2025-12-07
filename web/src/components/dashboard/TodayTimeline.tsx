import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { DashboardData } from '@/types/dashboard'

export type TodayTimelineProps = {
  events: DashboardData['todayEvents']
}

const COLORS = {
  bar: '#14b8a6',
  grid: '#e5e7eb',
}

// "HH:MM" → 時間(0〜24) に変換してチャート用データを作る
const toChartData = (events: DashboardData['todayEvents']) => {
  return events.map((e) => {
    const [h, m] = e.time.split(':').map(Number)
    const hour = h + m / 60
    return { ...e, hour }
  })
}

export default function TodayTimeline({ events }: TodayTimelineProps) {
  const data = toChartData(events)
  return (
    <section className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-black/5 min-w-0">
      <h3 className="text-[15px] font-medium text-neutral-800">⏰ 今日の食事タイムライン</h3>
      <div className="mt-3 h-[240px]  w-full min-w-0">
        <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              type="number"
              dataKey="hour"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tickFormatter={(v) => `${String(v).padStart(2, '0')}:00`}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              unit="g"
            />
            <Tooltip
              formatter={(value: unknown) => {
                const g = value as number
                return [`${g.toFixed(1)} g`, '摂取量']
              }}
              labelFormatter={(_label, payload) => {
                // 元の "HH:MM" をそのままツールチップのラベルにする
                const first = payload[0]
                return first && first.payload.time ? `時刻 ${first.payload.time}` : ''
              }}
              contentStyle={{
                borderRadius: 14,
                border: `1px solid ${COLORS.grid}`,
                fontSize: 12,
              }}
            />
            <Bar dataKey="g" radius={[10, 10, 0, 0]} fill={COLORS.bar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
