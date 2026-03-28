import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'
import { CalendarDays, Edit3, Funnel } from 'lucide-react'
import {
  healthLogFilterOptions,
  healthLogTypeLabels,
  healthLogTypes,
} from '@/lib/health-log/constants'
import type { HealthLogFilterType, HealthLogType } from '@/types/healthLog'
import { mockHealthLogs } from '@/lib/health-log/mock'
import { jst } from '@/lib/date'

/**
 * @description 健康記録ページの静的な骨組みを表示する
 * サマリー、フィルター、タイムラインの配置を確認するための段階
 */
export default function HealthLog() {
  const latestLog = mockHealthLogs[0]
  const latestHospitalVisit = mockHealthLogs.find((log) => log.type === 'hospital_visit')
  const latestWeight = mockHealthLogs.find((log) => log.type === 'weight')
  const [selectedType, setSelectedType] = useState<HealthLogFilterType>('all')
  const [selectedMonth, setSelectedMonth] = useState('2026-03')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRecordType, setSelectedRecordType] = useState<HealthLogType>('vomit')
  const initialOccurredDate = jst().format('YYYY-MM-DD')
  const initialOccurredTime = jst().format('HH:mm')
  const [occurredDate, setOccurredDate] = useState(initialOccurredDate)
  const [occurredTime, setOccurredTime] = useState(initialOccurredTime)
  const [note, setNote] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const filteredLogs = mockHealthLogs.filter((log) => {
    const matchesType = selectedType === 'all' || log.type === selectedType
    const matchesMonth = jst(log.occurredAt).format('YYYY-MM') === selectedMonth

    return matchesType && matchesMonth
  })

  // モーダルの初期化
  const handleCloseCreateModal = () => {
    setIsCreateOpen(false)
    setSelectedRecordType('vomit')
    setOccurredDate(initialOccurredDate)
    setOccurredTime(initialOccurredTime)
    setNote('')
    setWeightKg('')
  }

  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <PageHeader
          icon={<BsFillHeartPulseFill className="h-5 w-5" />}
          title="健康記録"
          right={
            <Button
              type="button"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <FaPlus className="h-3.5 w-3.5" />
              記録を追加
            </Button>
          }
        />

        {/* サマリーカード */}
        <section className="grid gap-3 md:grid-cols-3">
          {/* 最後の記録 */}
          <Card className="gap-0 py-0">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <BsFillHeartPulseFill className="h-3.5 w-3.5" />
                <span>最後の記録</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-xl font-semibold text-foreground">
                  {latestLog ? healthLogTypeLabels[latestLog.type] : '-'}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {latestLog ? latestLog.occurredAt.slice(0, 10) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 最終通院日 */}
          <Card className="gap-0 py-0">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <BsFillHeartPulseFill className="h-3.5 w-3.5" />
                <span>最終通院日</span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-semibold text-foreground">
                  {latestHospitalVisit ? latestHospitalVisit.occurredAt.slice(0, 10) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 最新の体重 */}
          <Card className="gap-0 py-0">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <BsFillHeartPulseFill className="h-3.5 w-3.5" />
                <span>体重</span>
                <span className="text-[11px] font-normal text-muted-foreground">(直近計測)</span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-semibold text-foreground">
                  {latestWeight?.weightKg ? `${latestWeight.weightKg}kg` : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* フィルター */}
        <section className="py-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Funnel className="h-4 w-4" />
            </div>

            {/* 種別ボタン */}
            <div className="flex flex-1 flex-wrap gap-2">
              {healthLogFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    option.value === selectedType
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* 日付選択 */}
            <div className="w-full lg:w-[180px]">
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
        </section>

        {/* タイムライン */}
        {filteredLogs.length === 0 ? (
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">
                条件に一致する記録がありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="border-t border-border">
            {filteredLogs.map((item) => (
              <article key={item.id} className="border-b border-border py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-emerald-600">
                        {healthLogTypeLabels[item.type]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {item.occurredAt}
                      </span>
                    </div>

                    {item.note ? (
                      <p className="mt-2 text-sm leading-6 text-foreground">{item.note}</p>
                    ) : null}

                    {item.weightKg ? (
                      <p className="mt-2 text-sm font-medium text-foreground">{item.weightKg}kg</p>
                    ) : null}

                    {item.photos.length > 0 ? (
                      <div className="mt-3 flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                        写真
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`${healthLogTypeLabels[item.type]}を編集`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {/* モーダル */}
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">健康記録を追加</h2>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                閉じる
              </button>
            </div>

            {/* 日付 */}
            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">日付</label>
                  <input
                    type="date"
                    value={occurredDate}
                    onChange={(event) => setOccurredDate(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>

                {/* 時刻 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">時刻</label>
                  <input
                    type="time"
                    value={occurredTime}
                    onChange={(event) => setOccurredTime(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">記録種別</label>
                <div className="flex flex-wrap gap-2">
                  {healthLogTypes.map((type) => {
                    const isActive = type === selectedRecordType
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedRecordType(type)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {healthLogTypeLabels[type]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 体重 */}
              {/* 種別を体重に設定したときのみ入力を可能にする */}
              {selectedRecordType === 'weight' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">体重(kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value)}
                    placeholder="3.80"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              ) : null}

              {/* メモ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">メモ</label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="症状の様子や通院内容を記録します"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">写真</label>
                <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  写真アップロード領域
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={handleCloseCreateModal}>
                キャンセル
              </Button>
              <Button type="button">保存</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
