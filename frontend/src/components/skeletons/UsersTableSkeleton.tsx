/**
 * @description users一覧の読み込み中スケルトンを表示する
 * @returns スケルトン表示コンポーネント
 */
export function UsersTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* タイトル行 */}
      <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-200" />

      {/* テーブル領域 */}
      <div className="overflow-x-auto rounded border">
        <div className="space-y-2 p-3">
          {/* ヘッダー行相当 */}
          <div className="h-8 rounded bg-neutral-200 dark:bg-neutral-200" />

          {/* データ行相当 */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 rounded bg-neutral-100 dark:bg-neutral-300" />
          ))}
        </div>
      </div>
    </div>
  )
}
