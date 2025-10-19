export default function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* タイトル部分 */}
      <div className="h-6 w-48 rounded bg-neutral-200 dark:bg-neutral-200" />

      {/* 入力フィールド部分 */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-1 text-left">
          <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-200" />
          <div className="h-9 w-full rounded bg-neutral-100 dark:bg-neutral-300" />
        </div>
      ))}

      {/* ボタン部分 */}
      <div className="mt-4 flex gap-2">
        <div className="h-10 w-24 rounded bg-neutral-200 dark:bg-neutral-200" />
        <div className="h-10 w-24 rounded bg-neutral-100 dark:bg-neutral-300" />
      </div>
    </div>
  )
}
