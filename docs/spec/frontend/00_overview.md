# Frontend Overview

## 役割

Frontend は、Backend から取得したデータを画面に表示し、利用者の入力を受け取る。

## 主な画面

- Login
- Dashboard
- Logs
- Settings
- Users

## 主な構成

- `pages`
  - 画面全体を組み立てる
- `components`
  - 表示部品を持つ
- `hooks`
  - 取得処理や画面状態をまとめる
- `lib`
  - API 呼び出しや共通処理を持つ

## 認証の扱い

- `AuthContext` がログイン状態をアプリ全体で共有する
- `auth_token` は `localStorage` に保存し、再読み込み時に復元する
- Web API 呼び出し時は `Authorization: Bearer ...` を自動で付ける
- `401` を受けた時は、保持している認証情報をクリアする
