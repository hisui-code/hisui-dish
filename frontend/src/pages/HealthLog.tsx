import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { healthLogTypeLabels, mockHealthLogs } from '@/lib/health-log/mock'
import { BsFillHeartPulseFill } from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa'

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
        <Card className="gap-0 py-0">
          <CardContent className="px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                  種別で絞り込む
                </p>
                <div className="flex flex-wrap gap-2">
                  {filterLabels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedType(label)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        label === selectedType
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-[180px]">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">年月</p>
                <input
                  type="month"
                  defaultValue="2026-03"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タイムライン */}
        {filteredLogs.length === 0 ? (
          <Card className="gap-0 py-0">
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">
                条件に一致する記録がありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            {filteredLogs.map((item, index, items) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
                  {index < items.length - 1 ? (
                    <span className="mt-2 h-full min-h-20 w-px bg-border" />
                  ) : null}
                </div>

                <Card className="flex-1 gap-0 py-0">
                  <CardContent className="space-y-3 px-5 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                        <p className="font-semibold text-foreground">
                          {healthLogTypeLabels[item.type]}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.occurredAt}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-500 transition-colors hover:text-red-600"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    {item.note ? (
                      <p className="text-sm leading-6 text-foreground">{item.note}</p>
                    ) : null}

                    {item.weightKg ? (
                      <p className="text-sm font-medium text-foreground">{item.weightKg}kg</p>
                    ) : null}

                    {item.photos.length > 0 ? (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                        写真
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
