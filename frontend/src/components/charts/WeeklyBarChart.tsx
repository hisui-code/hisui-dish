import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

/**
 * @description
 * 週グラフ用の表示行
 *
 * - week は W00 などの表示ラベル
 * - mondayMd は 月曜の日付（MM/DD）
 */
export type WeeklyBarChartRow = {
  week: string
  mondayMd: string
  total: number
}

/**
 * @description
 * 週グラフ専用の棒グラフ
 *
 * - SimpleBarChart はダッシュボードで使用しているため変更しない
 * - X軸は 2行表示（Wxx と 月曜の日付）にする
 *
 * @param args - 入力
 * @param args.data - 表示データ
 * @param args.height - 高さ
 */
export default function WeeklyBarChart(args: { data: WeeklyBarChartRow[]; height?: number }) {
  const { data, height = 240 } = args

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={<TwoLineWeekTick data={data} />}
          />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * @description
 * X軸ラベルを2行で描画する
 *
 * - payload.value は dataKey の値（week）になる
 * - index を使って mondayMd を参照する
 */
function TwoLineWeekTick(args: {
  x?: number
  y?: number
  payload?: { value?: string }
  index?: number
  data: WeeklyBarChartRow[]
}) {
  const { x = 0, y = 0, payload, index = 0, data } = args

  const week = String(payload?.value ?? '')
  const monday = data[index]?.mondayMd ?? ''

  return (
    <text x={x} y={y} textAnchor="middle" fill="#6b7280" fontSize={12}>
      <tspan x={x} dy="0.9em">
        {week}
      </tspan>
      <tspan x={x} dy="1.1em">
        {monday}
      </tspan>
    </text>
  )
}
