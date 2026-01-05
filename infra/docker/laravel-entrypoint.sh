#!/usr/bin/env bash
set -euo pipefail

cd /app

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ ! -d vendor ] && [ -f composer.json ]; then
  composer install --no-interaction --prefer-dist
fi

if [ -f artisan ] && [ -f .env ] && grep -q '^APP_KEY=$' .env; then
  php artisan key:generate --force
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
