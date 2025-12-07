import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

import type { DashboardData } from '@/types/dashboard'

export type MonthlyChartProps = {
  series: DashboardData['dailySeries']
}

const COLORS = {
  bar: '#3b82f6', // 青
  grid: '#e5e7eb', // neutral-200
}

export default function MonthlyChart({ series }: MonthlyChartProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-black/5 min-w-0">
      <h3 className="text-[15px] font-medium text-neutral-800">📊 今月の日別合計</h3>
      <div className="mt-2 w-full min-w-0">
        <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
          <BarChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: `1px solid ${COLORS.grid}`,
                fontSize: 12,
              }}
            />
            <Bar dataKey="total" radius={[10, 10, 0, 0]} fill={COLORS.bar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
