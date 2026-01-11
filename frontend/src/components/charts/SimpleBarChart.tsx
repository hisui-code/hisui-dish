import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export type SimpleBarChartProps<T extends Record<string, unknown>> = {
  /** @description 見出し */
  title: string
  /** @description グラフに渡す配列データ */
  data: T[]
  /** @description X軸に使うキー（例: "day", "month"） */
  xKey: Extract<keyof T, string>
  /** @description Barの値に使うキー（例: "total", "totalGrams"） */
  yKey: Extract<keyof T, string>
  /** @description グラフ高さ */
  height?: number
}

const COLORS = {
  bar: '#3b82f6',
  grid: '#e5e7eb',
}

/**
 * @description
 * ダッシュボード/インサイト共通で使うシンプルな棒グラフ
 *
 * - 軸やTooltipの見た目を統一する
 * - dataKey は xKey / yKey で切り替える
 */
export default function SimpleBarChart<T extends Record<string, unknown>>({
  title,
  data,
  xKey,
  yKey,
  height = 240,
}: SimpleBarChartProps<T>) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-black/5 min-w-0">
      <h3 className="text-[15px] font-medium text-neutral-800">{title}</h3>

      <div className="mt-2 w-full min-w-0">
        <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey={xKey}
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
            <Bar dataKey={yKey} radius={[10, 10, 0, 0]} fill={COLORS.bar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
