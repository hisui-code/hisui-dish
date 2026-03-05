type GenericErrorPageProps = {
  onRetry?: () => void
}

/**
 * @description 画面取得失敗時に共通で表示するエラーページ
 */
export default function GenericErrorPage({ onRetry }: GenericErrorPageProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      {/* 中央にエラー画像を表示する */}
      <img src="/images/error-cat.png" alt="エラー画像" className="w-full max-w-[360px] h-auto" />

      {/* 汎用メッセージだけ表示して個別理由は出さない */}
      <p className="mt-6 text-base font-medium text-neutral-800">エラーが発生しました</p>

      {/* 任意で再試行ボタンを表示する */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          再読み込み
        </button>
      )}
    </div>
  )
}
