# Frontend State And Data Flow

## 基本方針

- ページは画面構成を持つ
- components は表示責務を持つ
- hooks / lib は取得と状態管理を持つ

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
