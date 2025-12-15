import { useState, Suspense } from 'react'
import { useLogsData } from '@/hooks/useLogsData'
import type { TimeBand } from '@/types/logs'
import LogsFilter from '@/components/logs/LogsFilter'
import LogsList from '@/components/logs/LogsList'
import { filterLogs, groupLogsByDay, getDefaultMonth } from '@/lib/resources/logs'

function LogsContent() {
  const [month, setMonth] = useState<string>(getDefaultMonth())
  const [query, setQuery] = useState<string>('')
  const [timeBand, setTimeBand] = useState<TimeBand>('all')

  const rawLogs = useLogsData(month)
  const filteredLogs = filterLogs(rawLogs, month, query, timeBand)
  const groups = groupLogsByDay(filteredLogs)

  const handleDelete = () => {
    return console.log('delete log')
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

export default function Logs() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">読み込み中...</div>}>
      <LogsContent />
    </Suspense>
  )
}
