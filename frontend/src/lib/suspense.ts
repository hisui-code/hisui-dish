// React Suspense でデータ読み込みを扱うためのユーティリティ関数
// Promise をラップして「読み込み中・成功・失敗」を管理できるようにする

type Status = 'pending' | 'success' | 'error'

// Promise を受け取って Suspense 対応のラッパーを作成
export default function createResource<T>(promise: Promise<T>) {
  // 現在の状態を記録する（最初は「読み込み中」）
  let status: Status = 'pending'

  // 結果またはエラーを一時的に保存する
  let result: unknown

  // Promise の実行を開始
  const suspender = promise.then(
    // 正常に完了したとき
    (r) => {
      status = 'success' // 状態を「成功」に変更
      result = r // データを保存
    },
    // エラーが発生したとき
    (e) => {
      status = 'error' // 状態を「失敗」に変更
      result = e // エラー内容を保存
    }
  )

  // React コンポーネントから呼び出されるメソッド
  return {
    read(): T {
      // まだ読み込み中なら Promise を投げて Suspense に制御を渡す
      if (status === 'pending') throw suspender

      // エラーが発生していればその内容を投げて ErrorBoundary に渡す
      if (status === 'error') throw result

      // 成功時はデータを返す（型を T に変換）
      return result as T
    },
  }
}
