/**
 * @description 403が返ったときの403ページを表示する
 * @returns 403表示コンポーネント
 */
export function Forbidden() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">403</h2>
      <p className="text-sm text-neutral-600">このページを表示する権限がありません</p>
    </div>
  )
}
