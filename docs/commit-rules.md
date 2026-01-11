- `type`: 変更の種類（下記のいずれか）
- `scope`: 影響範囲（対象ディレクトリや領域）
- `subject`: 変更内容（日本語 OK。短く具体的に）

### Examples

- `feat(frontend): ログ画面に月フィルタを追加`
- `fix(backend): todayEventsの時刻をUTC解釈に統一`
- `chore(infra): composeのマウント先をbackend/frontendへ更新`
- `docs(docs): コミットルールを追加`

---

## Types

以下を基本セットとします。

- `chore`  
  タスクファイルや設定変更など、プロダクションの挙動に影響しない修正  
  例: ツール設定、依存更新、ディレクトリ整理、開発用スクリプトの修正

- `docs`  
  ドキュメントの更新  
  例: README / 設計メモ / 運用手順 / API 仕様書

- `feat`  
  ユーザー向けの機能の追加や変更  
  例: UI の新機能、API エンドポイント追加、ユーザーが利用する挙動の追加

- `fix`  
  ユーザー向けの不具合の修正  
  例: 500 エラー修正、表示崩れ修正、集計ズレ修正、認証不具合修正

- `refactor`  
  リファクタリングを目的とした修正（挙動は変えない）  
  例: ロジック整理、責務分割、命名改善、重複コード削減

- `style`  
  フォーマットなどのスタイルに関する修正（挙動は変えない）  
  例: prettier 適用、インデント/改行、lint 対応

- `test`  
  テストコードの追加や修正  
  例: Feature テスト追加、テスト修正、テスト用 fixture 更新

---

## Scope

基本は「どこを触ったか」が一目で分かる粒度にします。迷ったらディレクトリ名で OK。

推奨スコープ例：

- `frontend` : フロント（Vite + React）
- `backend` : バックエンド（Laravel）
- `backend-archive` : 退避した Rails 側（触る場合のみ）
- `infra` : Docker / Compose / Makefile / DevContainer 等
- `db` : migration / schema / seed 等
- `docs` : ドキュメント領域全般
- `rpi` : Raspberry Pi 側

### Scope の省略

小さな変更でも scope を付けるのが基本です。  
ただし、全体に跨る場合や判断が難しい場合は省略しても OK です。

例:

- `chore: リポジトリ全体の依存更新`

---

## Subject（件名）の書き方

- 日本語で OK
- できるだけ短く、具体的に
- 「何をどうしたか」が伝わる表現にする
- 末尾の句点は付けない（好みで統一）

OK 例:

- `fix(frontend): 設定保存時のエラー表示を改善`
- `refactor(backend): dashboard集計のクエリ生成を整理`

避けたい例:

- `fix: 修正`
- `feat: いろいろ`

---

## Breaking Change（互換性が壊れる変更）

API のレスポンス形変更や URL 変更など、互換性が壊れる場合は `!` を付けます。

例:

- `feat(backend)!: dashboard APIのレスポンス形式を変更`

補足として本文に理由・移行手順を書くのを推奨します。

---

## Mapping（旧ルールからの置き換え）

以前の `WEB:` / `API:` / `RPI:` は以下で置き換えます。

- `WEB:` → `*(frontend):`
- `API:` → `*(backend):` / `*(db):` / `*(infra):`
- `RPI:` → `*(rpi):`
