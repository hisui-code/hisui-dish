# 00 Overview

## プロジェクト名

HisuiDish（ひすいのごはん記録アプリ）

## 目的

猫（ひすい）の食事量（重量変化）を計測し、記録・可視化する。

## システム構成（要約）

- エサ台：Raspberry Pi 5 + Python（ロードセル + HX711）
- Web API：Laravel（API） + PostgreSQL（DB は UTC 保存）
- Web UI：React（Vite）

## 重要な仕様（迷子防止の“正”）

- 計測は「減少時のみ」記録対象（増加/変化なしは除外）
  - ただし将来的に「ご飯を追加した（増加）」もイベントとして記録できるよう拡張予定
- 変化検知 → 3 分静止で記録 → 最大 10 分で強制終了
- DB 保存は UTC。表示/集計は JST 境界で期間を決めて UTC へ変換してクエリする
- RasPi→API は REST Push（失敗時は退避 → 再送）
- PWA→RasPi はローカル限定のリアルタイム操作（WebSocket 想定）

## 用語

- session：計測開始〜終了（最大 10 分）
- stable：重量が一定とみなせる状態（3 分）
- snapshot：DB に保存される 1 レコード（計測結果）
