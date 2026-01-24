/**
 * @description
 * チャートカード用の軽量スケルトン。
 * ダッシュボード全体のスケルトンとは別に、個別カードの読み込みに使う。
 * @returns チャートカードのプレースホルダ
 */
export default function ChartCardSkeleton() {
  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-black/5 min-w-0 animate-pulse">
      <div className="h-4 w-32 rounded-full bg-neutral-200" />
      <div className="mt-4 h-56 rounded-2xl bg-neutral-100" />
    </section>
  )
}
