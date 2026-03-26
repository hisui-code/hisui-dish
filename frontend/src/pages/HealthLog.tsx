import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { healthLogTypeLabels, mockHealthLogs } from '@/lib/health-log/mock'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'
import { CalendarDays, Edit3, Funnel } from 'lucide-react'

const filterLabels = ['すべて', ...Object.values(healthLogTypeLabels)]
type HealthLogFilterLabel = 'すべて' | (typeof filterLabels)[number]

/**
 * @description 健康記録ページの静的な骨組みを表示する
 * サマリー、フィルター、タイムラインの配置を確認するための段階
 * @returns 健康記録ページ
 */
export default function HealthLog() {
  const latestLog = mockHealthLogs[0]
  const latestHospitalVisit = mockHealthLogs.find((log) => log.type === 'hospital_visit')
  const latestWeight = mockHealthLogs.find((log) => log.type === 'weight')

  const [selectedType, setSelectedType] = useState<HealthLogFilterLabel>('すべて')

  const filteredLogs =
    selectedType === 'すべて'
      ? mockHealthLogs
      : mockHealthLogs.filter((log) => healthLogTypeLabels[log.type] === selectedType)

  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6">
        <PageHeader
          icon={<BsFillHeartPulseFill className="h-5 w-5" />}
          title="健康記録"
          right={
            <Button type="button" className="inline-flex items-center gap-2">
              <FaPlus className="h-3.5 w-3.5" />
              新しい記録を追加
            </Button>
          }
        />

        {/* サマリーカード */}
        <section className="grid gap-3 md:grid-cols-3">
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
        <section className="border-border py-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Funnel className="h-4 w-4" />
            </div>

            <div className="flex flex-1 flex-wrap gap-2">
              {filterLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedType(label)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    label === selectedType
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-[180px]">
              <input
                type="month"
                defaultValue="2026-03"
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
    </div>
  )
}
