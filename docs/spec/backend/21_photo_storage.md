# Photo Storage

## 目的

ユーザーがアップロードした画像本体を DB から分離し、Backend は認可とメタデータ管理に集中する。
開発環境、自動テスト、本番環境で保存先を切り替えられるようにする。

## 影響範囲

- API: 画像アップロード開始、完了、表示 URL 取得の API を追加する想定
- DB: 画像本体ではなく、画像メタデータを保存する `photos` テーブルを追加する想定
- UI: React から画像をアップロードし、保存結果を表示する想定
- 保存: 開発環境は local disk、本番環境は Cloudflare R2 を使う
- テスト: `Storage::fake()` で外部 storage に依存しない確認を行う

## 保存方針

画像本体は DB に保存しない。
DB には画像を探すためのメタデータだけを保存する。

```txt
開発環境: Laravel local disk
自動テスト: Storage::fake()
本番環境: Cloudflare R2
```

## 責務分離

### React

- ファイル選択を行う
- Backend からアップロード先を取得する
- 画像本体を storage へ送る
- アップロード完了を Backend へ通知する

### Backend

- ログインユーザーを認可する
- object key を生成する
- アップロード先 URL を発行する
- アップロード完了後に object の存在、所有者、サイズ、MIME を確認する
- DB に画像メタデータを保存する
- 表示用 URL を返す前に所有者を確認する

### Object Storage

- 画像本体を保存する
- `original`、`display`、`thumb` などの派生画像を保存する
- 未完了アップロードの削除方針を持つ

### DB

- 画像本体は持たない
- 所有者、保存先 disk、object key、MIME、byte 数、公開状態を保存する

## 初期実装方針

最初は画像最適化サービスを入れず、`original` の保存を優先する。
一覧や詳細表示で必要になった時点で、`display` と `thumb` の固定派生画像を追加する。

保存 API は、実装初期から disk 名を設定で切り替えられるようにする。

```txt
PHOTOS_DISK=local
PHOTOS_DISK=s3
```

Laravel の画像保存処理では、直接 `local` や `s3` を埋め込まず、画像用 disk 設定を参照する。

## セキュリティ方針

- object key は推測されにくい UUID を含める
- object key には `users/{user_id}/...` のように所有者境界を含める
- complete API では、受け取った key がログインユーザーの領域に属するか確認する
- presign 時の `size` は自己申告なので、complete 時に実サイズを確認する
- サイズ超過や不正 MIME の object は削除する
- 一時 URL は DB に保存しない
- 非公開画像は、Backend が認可した後に短命 URL を返す

## 未完了アップロード

presign 後に storage へ PUT されたまま、complete API が呼ばれない object が残る可能性がある。
初期実装では `tmp/` prefix への保存か、期限付き cleanup を前提にする。

```txt
users/{user_id}/tmp/{uuid}
users/{user_id}/originals/{uuid}.{ext}
```

## 確認方針

- 開発環境では local disk に画像が保存されることを確認する
- 自動テストでは `Storage::fake()` で保存、未保存、DB 登録を確認する
- complete API では、他ユーザー領域の key が拒否されることを確認する
- 本番環境では R2 の bucket、CORS、endpoint、credential を環境変数で設定する
