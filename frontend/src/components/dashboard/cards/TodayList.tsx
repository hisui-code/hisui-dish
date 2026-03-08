import { FaBowlFood, FaBowlRice } from 'react-icons/fa6'
import { FaClock } from 'react-icons/fa'
import { LuUtensils } from 'react-icons/lu'
import { GiKitchenScale } from 'react-icons/gi'
import type { DashboardTodayViewModel } from '@/hooks/dashboard/useDashboardKpisToday'

type TodayListProps = {
  today: DashboardTodayViewModel
}

/**
 * @description 今日の食事回数、合計量、各食事イベントを一覧表示する
 * ダッシュボード上で今日の記録だけを素早く確認できるようにする
 */
export default function TodayList({ today }: TodayListProps) {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-[15px] font-medium text-neutral-800">
          <FaBowlFood className="text-emerald-500" aria-hidden="true" />
          <span>今日の記録</span>
        </h3>
        {/* 食事回数 | 食事合計 */}
        <div className="rounded-2xl bg-neutral-30 px-4 py-3 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-100">
          <div className="flex items-center gap-4">
            {/* 食事回数 */}
            <div className="flex items-center gap-2">
              <FaClock className="text-neutral-400" aria-hidden="true" />
              <span className="font-semibold text-neutral-900">{today.count} 回</span>
            </div>
            <div className="h-4 w-px bg-neutral-200" aria-hidden="true" />
            {/* 食事合計 */}
            <div className="flex items-center gap-2">
              <FaBowlRice className="text-neutral-400" aria-hidden="true" />
              <span className="font-semibold text-neutral-900">
                {today.totalGrams.toFixed(1)}
                <span className="ml-1 text-xs font-medium text-neutral-500">g</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* 記録がある時は時刻ごとの一覧を出し、無い時は空状態を出す */}
      {today.hasEvents ? (
        <ul className="divide-y divide-neutral-100">
          {today.events.map((e, index) => (
            <li
              key={`${e.time}-${index}`}
              className="flex items-center justify-between px-10 py-4 font-semibold"
            >
              {/* 時間 */}
              <span className="flex items-center gap-2 text-base tabular-nums text-neutral-800">
                <LuUtensils className="text-emerald-500" aria-hidden="true" />
                <span className="text-lg">{e.time}</span>
              </span>

              {/* 食事量 */}
              <span className="flex items-center gap-2 text-base tabular-nums text-neutral-800">
                <GiKitchenScale className="text-emerald-500" aria-hidden="true" />
                {e.g.toFixed(1)}
                <span className="ml-1 text-xs font-medium text-neutral-500">g</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-neutral-500">まだ記録がありません</div>
      )}
    </div>
  )
}
