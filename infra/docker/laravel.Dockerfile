ARG PHP_VERSION=8.5-rc
FROM php:${PHP_VERSION}-cli

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/composer

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    bash curl git unzip libpq-dev libzip-dev libonig-dev \
 && docker-php-ext-install pdo_pgsql mbstring zip \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app

COPY infra/docker/laravel-entrypoint.sh /usr/local/bin/laravel-entrypoint.sh
RUN chmod +x /usr/local/bin/laravel-entrypoint.sh

EXPOSE 8000
CMD ["/usr/local/bin/laravel-entrypoint.sh"]
