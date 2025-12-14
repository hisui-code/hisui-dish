import { useMemo, useState } from 'react'

import type { LogGroup, LogItem, TimeBand } from '@/types/logs'
import LogsFilter from '@/components/logs/LogsFilter'
import LogsList from '@/components/logs/LogsList'
import { filterLogs, groupLogsByDay, getDefaultMonth } from '@/lib/resources/logs'

/**
 * LogsPage:
 * - フィルター状態の管理
 * - ログ一覧のフィルタリング・グルーピング
 */

const demoLogs: LogItem[] = [
  { id: 'a', recordedAtIso: '2025-12-13T08:12:00+09:00', grams: 22 },
  { id: 'b', recordedAtIso: '2025-12-13T12:45:00+09:00', grams: 18 },
  { id: 'c', recordedAtIso: '2025-12-13T19:10:00+09:00', grams: 25 },
  { id: 'd', recordedAtIso: '2025-12-12T07:58:00+09:00', grams: 20 },
  { id: 'e', recordedAtIso: '2025-12-12T21:05:00+09:00', grams: 14 },
]

export default function Logs() {
  const [month, setMonth] = useState<string>(getDefaultMonth())
  const [query, setQuery] = useState<string>('')
  const [timeBand, setTimeBand] = useState<TimeBand>('all')
  const [logs, setLogs] = useState<LogItem[]>(demoLogs)

  const visibleLogs = useMemo(
    () => filterLogs(logs, month, query, timeBand),
    [logs, month, query, timeBand]
  )

  const groups = useMemo<LogGroup[]>(() => groupLogsByDay(visibleLogs), [visibleLogs])

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto w-full max-w-3xl px-1 py-3 sm:py-10">
        {/* ヘッダー */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">ログ</h1>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <LogsFilter
          month={month}
          onMonthChange={setMonth}
          query={query}
          onQueryChange={setQuery}
          timeBand={timeBand}
          onTimeBandChange={setTimeBand}
        />

        {/* 一覧 */}
        <div className="mt-5">
          <LogsList groups={groups} onDelete={handleDelete} month={month} />
        </div>
      </div>
    </div>
  )
}
