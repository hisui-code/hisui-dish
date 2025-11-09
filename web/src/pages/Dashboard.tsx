import { useEffect, useState } from 'react'
import Kpis from '@/components/dashboard/Kpis'
import type { DashboardData } from '@/types/dashboard'
import { fetchDashboard } from '@/lib/fetchDashboard'

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
    let alive = true // アンマウント後の setState を防止
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDashboard(month) // API から取得（モックは使わない前提）
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
    return () => {
      alive = false
    }
  }, [month])

  //Loading中
  if (loading || !data) {
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

  //エラー表示
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  //データなし
  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white px-4 py-3 text-sm text-neutral-600">
          データが見つかりませんでした
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Kpis data={{ todayTotal: data.todayTotal, bowlRemaining: data.bowlRemaining }} />
    </div>
  )
}
