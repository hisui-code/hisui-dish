import { useState, Suspense } from 'react'
import { useLogsData } from '@/hooks/logs/useLogsData'
import type { TimeBand } from '@/types/logs'
import LogsFilter from '@/components/logs/LogsFilter'
import LogsList from '@/components/logs/LogsList'
import { filterLogs, groupLogsByDay, getDefaultMonth } from '@/lib/resources/logs'
import { FaBook } from 'react-icons/fa'
import { PageHeader } from '@/components/layout/PageHeader'

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

  return (
    <div className="px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-6">
        {/* ヘッダー */}
        <PageHeader icon={<FaBook className="h-5 w-5" />} title="ログ" />

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
        <LogsList groups={groups} month={month} />
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
