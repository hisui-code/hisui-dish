ARG RUBY_VERSION=3.4.5
FROM ruby:${RUBY_VERSION}-slim

ENV APP_HOME=/app \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    TZ=Asia/Tokyo \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle

WORKDIR ${APP_HOME}

# psych(libyaml) / pg などのネイティブ拡張に必要
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    build-essential git curl libpq-dev libyaml-dev pkg-config \
 && rm -rf /var/lib/apt/lists/*

# Gem のキャッシュを効かせる（存在しなくても OK）
COPY api-archive/Gemfile api-archive/Gemfile.lock ./
RUN gem install bundler -v "~> 2.6" \
 && bundle config set path '/usr/local/bundle' \
 && bundle lock --add-platform ruby || true \
 && bundle lock --add-platform aarch64-linux || bundle lock --add-platform arm64-linux || true \
 && bundle install || true

# アプリ全体
COPY api-archive/ .

# 起動前に bundle / db:prepare を済ませてから Puma を起動
COPY infra/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000
CMD ["/usr/local/bin/entrypoint.sh"]
