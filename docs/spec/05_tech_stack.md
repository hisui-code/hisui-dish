# 05 Tech Stack

## Frontend

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| React | 19.1.1 | UI 構築 |
| React DOM | 19.1.1 | DOM 描画 |
| React Router DOM | 7.10.1 | ルーティング |
| TypeScript | 5.8.3 | 型安全な実装 |
| Vite | 7.1.2 | 開発サーバ、ビルド |
| TanStack Query | 5.90.12 | サーバ状態管理 |
| Tailwind CSS | 4.1.13 | スタイリング |
| `@tailwindcss/vite` | 4.1.13 | Vite 連携 |
| Recharts | 3.4.1 | グラフ描画 |
| Zod | 4.1.12 | バリデーション |
| MUI | 7.3.7 | UI コンポーネント |
| MUI X Date Pickers | 8.24.0 | 日付入力 |
| Radix UI Dialog | 1.1.15 | ダイアログ UI |
| Framer Motion | 12.23.26 | アニメーション |
| Vitest | 3.2.4 | テスト |
| Testing Library React | 16.3.0 | UI テスト |
| ESLint | 9.35.0 | 静的解析 |
| Prettier | 3.6.2 | フォーマット |

## Backend

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| PHP | 8.5-rc | API 実行環境 |
| Laravel Framework | 12 | Web API |
| Laravel Sanctum | 4 | 認証 |
| PostgreSQL | 16 | 永続化 |
| PHPUnit | 11 | テスト |
| Laravel Pint | 1 | コード整形 |
| PHP CS Fixer | 3.93 | コード整形 |
| Guzzle | 7.2 | HTTP クライアント |

## Device

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Python | 3.12 | Device アプリ実行環境 |
| HX711 Python library | 未固定 | 重量センサー読み取り |
| `rpi-lgpio` | 未固定 | GPIO 制御 |

## Infra

| 技術 | バージョン | 用途 |
| --- | --- | --- |
| Docker Compose | 利用 | 開発環境の起動 |
| `postgres` image | 16 | DB コンテナ |
| `php` image | 8.5-rc-cli | Laravel コンテナ |
| `python` image | 3.12-slim | Device 開発用コンテナ |

## Device の補足

| 技術 | 補足 |
| --- | --- |
| HX711 Python library | `git+https://github.com/gandalf15/HX711.git` を利用 |
| `rpi-lgpio` | `requirements.txt` では version を固定していない |
