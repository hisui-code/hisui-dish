# Hisui Dish API (Laravel)

This is the new Laravel API (Laravel 10 LTS) running in Docker with PHP 8.5.

## Quick start (Docker)

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d --build
```

Laravel will be available at http://localhost:8000.

## Artisan commands

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec api-laravel php artisan <command>
```

Example:

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec api-laravel php artisan --version
```

## Tests

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec api-laravel php artisan test
```

Or:

```bash
make api-test
```

## Shell

```bash
make api-shell
```

## Environment

`.env` is created from `.env.example` on first container start if missing.
Required variables for local Docker use:

- APP_KEY
- APP_URL
- DB_CONNECTION
- DB_HOST
- DB_PORT
- DB_DATABASE
- DB_USERNAME
- DB_PASSWORD

For general Laravel usage, see https://laravel.com/docs.
