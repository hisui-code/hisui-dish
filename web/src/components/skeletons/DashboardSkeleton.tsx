export default function DashboardSkeleton() {
  return (
    <div className="p-3 min-w-0 space-y-6 animate-pulse">
      {/* KPI セクションのスケルトン */}
      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_6px_18px_rgba(0,0,0,.06)]"
          >
            {/* ラベル行（アイコン＋テキスト）のスケルトン */}
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-neutral-600">
              <div className="h-4 w-4 rounded-full bg-neutral-200" />
              <div className="h-3 w-20 rounded-full bg-neutral-200" />
            </div>
            {/* 数字＋g のスケルトン（カード中央に置く） */}
            <div className="mt-1.5 flex-1 flex items-center justify-center">
              <div className="flex items-baseline justify-center gap-2">
                <div className="h-8 w-16 rounded-full bg-neutral-200" />
                <div className="h-4 w-6 rounded-full bg-neutral-100" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 今日の記録セクションのスケルトン */}
      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        {/* ヘッダー部分 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          {/* タイトル（アイコン＋テキスト）のスケルトン */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-neutral-200" />
            <div className="h-4 w-24 rounded-full bg-neutral-200" />
          </div>
          {/* 食事回数 | 食事合計 のバッジ部分 */}
          <div className="rounded-2xl bg-neutral-30 px-4 py-3 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-100">
            <div className="flex items-center gap-4">
              {/* 食事回数 */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-neutral-200" />
                <div className="h-4 w-10 rounded-full bg-neutral-200" />
              </div>
              <div className="h-4 w-px bg-neutral-200" aria-hidden="true" />
              {/* 食事合計 */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-neutral-200" />
                <div className="h-4 w-16 rounded-full bg-neutral-200" />
              </div>
            </div>
          </div>
        </div>
        {/* リスト部分（数件ぶんのダミー行） */}
        <ul className="divide-y divide-neutral-100">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center justify-between px-10 py-4">
              {/* 時刻のスケルトン */}
              <div className="h-5 w-16 rounded-full bg-neutral-200" />
              {/* g 数のスケルトン */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-neutral-200" />
                <div className="h-5 w-16 rounded-full bg-neutral-200" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 今月グラフセクションのスケルトン */}
      <section className="rounded-3xl bg-white p-4 ring-1 ring-black/5 min-w-0">
        {/* タイトル行 */}
        <div className="h-4 w-32 rounded-full bg-neutral-200" />
        {/* グラフ本体エリア */}
        <div className="mt-4 h-56 rounded-2xl bg-neutral-100" />
      </section>
    </div>
  )
}
