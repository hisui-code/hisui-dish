# Frontend State And Data Flow

## 基本方針

- ページは画面構成を持つ
- components は表示責務を持つ
- hooks / lib は取得と状態管理を持つ

## 責務分離のルール

### pages

- route に対応する画面の入口を担当する
- ページ全体の余白、ヘッダー、主要セクションの配置を持つ
- API 呼び出し、保存処理、削除処理、複雑な表示整形は直接持たない
- 複数の hook を接続するだけなら許容する
- 接続処理が増えて読みづらい場合は page hook へ寄せる

### page hooks

- 画面全体で使う状態と操作をまとめる
- page が直接扱う view model を返す
- 複数の state hook、query hook、action hook を組み合わせてよい
- ただし、すべての処理を 1 hook に集約しない
- 入力状態、一覧取得、保存削除など、責務が違うものは小さな hook に分ける

### query hooks

- React Query を使った取得状態を担当する
- `lib/api` の関数を呼び出す
- query key と取得条件を明示する
- 表示用の重い整形は持たない
- 軽い fallback や error message 変換は許容する

### action hooks

- 保存、削除、アップロードなど副作用を持つ操作を担当する
- 複数の状態をまたぐ操作をまとめる
- validation、payload 組み立て、API 呼び出し、query invalidate の流れを扱う
- 表示 JSX は持たない

### state hooks

- モーダル、ダイアログ、フォーム入力など UI 状態を担当する
- API 呼び出しは原則持たない
- 初期値作成や reset のような UI 状態に閉じた処理は持ってよい

### section / container components

- 局所的な Suspense 境界や取得境界として使う
- `Dashboard` の chart section のように、重い表示領域を分けたい場合に使う
- hook を呼び、取得結果を表示 component に渡してよい
- ファイル名は `*Section` または `*Container` とし、通常の表示 component と区別する
- 汎用 UI として使い回す component にはしない

### components

- props を受け取って表示することを担当する
- API 呼び出しや React Query の詳細を直接持たない
- ボタン押下や input change は親から受け取った handler を呼ぶ
- その component 内だけで完結する軽い UI 状態は持ってよい
- URL 取得や保存のような副作用が必要になったら hook または section / container に逃がす

### lib/api

- HTTP 通信を担当する
- request path、method、API payload、API response の変換を扱う
- UI 状態や React hooks は持たない

### lib/feature

- feature 固有の純粋関数を置く
- 絞り込み、グループ化、表示用サマリー、payload 組み立てを扱う
- React hooks や API 呼び出しは持たない

### schemas

- 入力値の validation を担当する
- 画面に表示するエラーメッセージをここで決めてよい
- API 呼び出しや UI 状態は持たない

## 判断基準

- JSX が中心なら `components`
- `useState` や `useQuery` が中心なら `hooks`
- HTTP が中心なら `lib/api`
- React に依存しない変換なら `lib/feature`
- validation なら `schemas`
- 複数の hook を束ねて page に渡すなら `page hook`
- 表示領域単位の取得境界なら `section / container component`

## データ取得

- API 呼び出しは `lib/api` に寄せる
- 画面で使う取得処理は `hooks` に寄せる
- `useSuspenseQuery` や `useQuery` を使って取得状態を扱う
- page は hook の戻り値を受けて表示する

## 認証状態の流れ

- `AuthProvider` が `ready`、`loggedIn`、`authToken` を持つ
- 初期表示時に `localStorage` から `auth_token` を復元する
- `login` 成功時は `auth_token` と `role` を保存する
- `logout` 時はローカルの認証情報を先に消し、その後サーバーへログアウトを送る
- 共通 API クライアントは、保持中の `auth_token` を `Authorization` ヘッダーへ付ける
- API が `401` を返した時は、認証情報を消してログイン状態を解除する
- `useMeQuery` はログイン中だけ現在ユーザー情報を取得する

## ルーティングと権限制御

- `ProtectedRoute` が未ログイン時のアクセスを止める
- 未ログインで保護画面を開いた時は `/login` へ遷移する
- `LoginRoute` は、ログイン済みユーザーを `/` へ戻す
- `AppLayout` は `useMeQuery` から現在ユーザー情報を取得する
- `AppLayout` は `me.role === 'admin'` から `isAdmin` を作る
- `AdminRoute` は `isAdmin` を見て管理者限定画面を保護する
- 管理者でない時は `Forbidden` を表示する

## 画面ごとの流れ

### Dashboard

- `Dashboard` は画面の枠だけを持つ
- `useDashboardState` が表示中の月や週の状態を持つ
- `useDashboardKpisToday` や各 dashboard hook が集計値を組み立てる
- `Kpis` や各 chart component が表示する

### Logs

- `Logs` はフィルター条件を持つ
- `useLogsData` が対象月のログを取得する
- `lib/resources/logs` が絞り込みと日ごとのグループ化を行う
- `LogsList` が一覧表示する

### HealthLog

- `HealthLog` はフィルター条件と入力中の状態を持つ
- health log 用の hook が一覧、選択中レコード、ダイアログ表示をまとめる
- health log 用の lib が絞り込みや表示向け整形を行う
- 一覧 component と form component が表示を担当する

### Settings

- `useDeviceSetting` が DeviceSettings を取得する
- `Settings` は loading、error、success の分岐を行う
- `DeviceSettingsForm` が入力と保存を担当する

### Users

- `useUsersQuery` が一覧と認可状態を取得する
- `useUsersPage` が削除中やエラー表示の状態をまとめる
- `useUserSettingsModal` が作成、編集モーダルの状態を持つ
- 画面に入る前に `AdminRoute` が管理者権限を確認する

### Login

- `useLoginForm` が入力値、送信中、エラーを持つ
- `LoginForm` は受け取った状態を表示する
- `useAuth` の `loginWithPassword` を通してログインする
- ログイン成功後は `AuthContext` の状態が更新される

## 表示整形

- 表示上必要な軽い整形のみ Frontend で行う
- 集計の正本は Backend が返す
- ログの絞り込みやグループ化のような UI 向け整形は Frontend で行う

## エラー表示

- 認証エラー
- 一般エラー
- バリデーションエラー

これらを UI 上で区別して扱えることを目指す。
