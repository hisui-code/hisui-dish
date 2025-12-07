import { useEffect, useState } from 'react'
import Kpis from '@/components/dashboard/Kpis'
import TodayList from '@/components/dashboard/TodayList'
import type { DashboardData } from '@/types/dashboard'
import { fetchDashboard } from '@/lib/api/dashboardApi'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import TodayTimeline from '@/components/dashboard/TodayTimeline'

// 月を "YYYY-MM" 形式にフォーマット
const fmtMonth = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function DashBoard() {
  const [month] = useState<string>(() => fmtMonth(new Date()))
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 非同期中にアンマウントされた場合に setState しないためのフラグ
    let alive = true

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        const d = await fetchDashboard(month)
        if (!alive) return
        setData(d)
      } catch {
        if (!alive) return
        setError('ダッシュボードの取得に失敗しました')
        setData(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    // クリーンアップ時にフラグを折る
    return () => {
      alive = false
    }
  }, [month])

  // ローディング中
  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-[96px] animate-pulse rounded-2xl bg-neutral-200" />
          <div className="h-[96px] animate-pulse rounded-2xl bg-neutral-200" />
          <div className="h-[96px] animate-pulse rounded-2xl bg-neutral-200" />
        </div>
      </div>
    )
  }

  // エラー
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  // データなし（404などで空配列が返ったケースも将来考慮）
  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white px-4 py-3 text-sm text-neutral-600">
          データが見つかりませんでした
        </div>
      </div>
    )
  }

  // 通常表示
  return (
    <div className="p-6 min-w-0">
      {/* KPI */}
      <Kpis data={{ todayTotal: data.todayTotal, bowlRemaining: data.bowlRemaining }} />

      {/* 今日の記録 */}
      <TodayTimeline events={data.todayEvents} />
      <TodayList events={data.todayEvents} />
      {/* 今月の日別合計グラフ */}
      <MonthlyChart series={data.dailySeries} />
    </div>
  )
}
