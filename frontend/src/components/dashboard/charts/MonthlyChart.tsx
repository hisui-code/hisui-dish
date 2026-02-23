import { useMemo } from 'react'
import SimpleBarChart from '@/components/charts/SimpleBarChart'
import { FaChartLine } from 'react-icons/fa6'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ja'
import type { DailyTotals } from '@/types/dashboard'

type MonthlyChartProps = {
  month: string
  onChangeMonth: (next: string) => void
  series: DailyTotals
}

/**
 * @description
 * 「日ごとの合計」棒グラフ
 */
export default function MonthlyChart({ month, onChangeMonth, series }: MonthlyChartProps) {
  // picker表示用に YYYY-MM から月初Dayjsへ変換する
  const value = useMemo(() => dayjs(`${month}-01`), [month])

  // picker変更を画面状態の YYYY-MM へ戻す
  const handleChangeMonth = (next: Dayjs | null) => {
    if (!next) return
    onChangeMonth(next.format('YYYY-MM'))
  }

  return (
    <Card className="rounded-xl shadow-sm mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2 text-[15px] font-medium text-neutral-800">
            <FaChartLine className="text-emerald-500" aria-hidden="true" />
            <span>日ごとの合計</span>
          </div>
          <div>
            {/* 年月 */}
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
              <DatePicker
                // label="年月"
                views={['year', 'month']}
                openTo="month"
                value={value}
                onChange={handleChangeMonth}
                format="YYYY年M月"
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      width: 180,
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0.5 sm:px-6">
        {/* グラフ */}
        <SimpleBarChart title="" data={series} xKey="day" yKey="total" />
      </CardContent>
    </Card>
  )
}
