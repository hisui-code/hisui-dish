import { useState, Suspense } from 'react'
import { useLogsData } from '@/hooks/useLogsData'
import type { TimeBand } from '@/types/logs'
import LogsFilter from '@/components/logs/LogsFilter'
import LogsList from '@/components/logs/LogsList'
import { filterLogs, groupLogsByDay, getDefaultMonth } from '@/lib/resources/logs'

/**
 * @description ログ一覧ページのメインコンテンツを描画する
 * @returns ログ一覧ページのJSX
 */
function LogsContent() {
  const [month, setMonth] = useState<string>(getDefaultMonth())
  const [query, setQuery] = useState<string>('') // 検索文字列
  const [timeBand, setTimeBand] = useState<TimeBand>('all')
  // 指定した月のログを取得
  const rawLogs = useLogsData(month)
  // フィルター
  const filteredLogs = filterLogs(rawLogs, month, query, timeBand)
  const groups = groupLogsByDay(filteredLogs)

  const handleDelete = () => {
    return console.log('delete log')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-3 pb-10 pt-6 sm:pt-10">
        {/* ヘッダー */}
        <div className="bg-card py-4 sm:px-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">ログ</h1>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-card">
          <LogsFilter
            month={month}
            onMonthChange={setMonth}
            query={query}
            onQueryChange={setQuery}
            timeBand={timeBand}
            onTimeBandChange={setTimeBand}
          />
        </div>

        {/* 一覧 */}
        <div className="mt-5">
          <LogsList groups={groups} onDelete={handleDelete} month={month} />
        </div>
      </div>
    </div>
  )
}

/**
 * @description ログ一覧ページの遅延読み込みを行う
 * @returns ログ一覧ページのJSX
 */
export default function Logs() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">読み込み中...</div>}>
      <LogsContent />
    </Suspense>
  )
}
