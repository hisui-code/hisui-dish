#!/usr/bin/env bash
set -euo pipefail

cd /app

# 依存関係（ホットマウントで Gems が見えなくなるケースの保険）
bundle check || bundle install

# DB 初期化（存在すれば何もしない）
bin/rails db:prepare

# Puma 起動
exec bin/rails s -b 0.0.0.0 -p 3000