# ---- Config ----------------------------------------------------
COMPOSE := docker compose -f infra/docker/docker-compose.dev.yml

# デフォルトは api。必要に応じて `make <target> SERVICE=web` のように上書き可能
SERVICE ?= api
API_SVC := api
WEB_SVC := web
DB_SVC  := db

RUN  := $(COMPOSE) run --rm $(SERVICE) bash -lc
EXEC := $(COMPOSE) exec      $(SERVICE) bash -lc

.DEFAULT_GOAL := help
.PHONY: help up up-b build down stop restart rebuild logs tail ps bash sh bundle setup env \
        db db-prepare db-reset migrate seed schema routes console \
        test rspec rubocop fmt fmt-safe ci \
        rspec_install spec_health lint-all \
        web-install web-dev web-build

# ---- Help ------------------------------------------------------
help: ## このヘルプ
	@echo "Usage: make <target> [SERVICE=api|web]"
	@echo
	@awk 'BEGIN {FS":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---- Lifecycle -------------------------------------------------
up: ## すべて起動（バックグラウンド）
	$(COMPOSE) up -d

up-b: build up ## (= build + up)

build: ## ビルド（サービス指定可：SERVICE=api など）
	$(COMPOSE) build $(SERVICE)

down: ## 停止＋ネットワーク維持
	$(COMPOSE) down

stop: ## 停止（コンテナは残す）
	$(COMPOSE) stop

restart: ## 指定サービスだけ再起動（デフォルト api）
	$(COMPOSE) restart $(SERVICE)

rebuild: ## ボリューム初期化→ビルド→起動→ログ（破壊的）
	$(COMPOSE) down -v
	$(COMPOSE) build --no-cache $(SERVICE)
	$(COMPOSE) up -d
	$(COMPOSE) logs -f $(SERVICE)

ps: ## 稼働状況
	$(COMPOSE) ps

logs: ## 指定サービスのログをフォロー（デフォルト api）
	$(COMPOSE) logs -f $(SERVICE)

tail: logs ## (=logs)

# ---- Shell / one-off ------------------------------------------
bash: ## 稼働中コンテナに入る（デフォルト api）
	$(COMPOSE) exec $(SERVICE) bash

sh: ## 一回限りで入る（コンテナ未起動でもOK）
	$(COMPOSE) run --rm $(SERVICE) bash

# ---- Env / Setup ----------------------------------------------
env: ## .env が無ければ .env.example から作成
	@test -f .env || (cp .env.example .env && echo "created .env from .env.example")

bundle: ## bundle install（コンテナ未起動でもOK / api）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle config set path '/usr/local/bundle' && bundle install"

setup: env ## 初期セットアップ（bundle + db:prepare）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle config set path '/usr/local/bundle' && bundle install && bin/rails db:prepare"

# ---- DB (api) --------------------------------------------------
db: db-prepare ## (=db-prepare)

db-prepare: ## db作成＆マイグレーション
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails db:prepare"

db-reset: ## DB初期化（危険）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails db:drop db:create db:migrate db:seed"

migrate: ## マイグレーションだけ
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails db:migrate"

seed: ## シード投入
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails db:seed"

schema: ## schema.rb 更新を確認
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails db:schema:dump && git status --porcelain db/schema.rb"

# ---- App utilities (api) --------------------------------------
console: ## rails console
	$(COMPOSE) exec $(API_SVC) bash -lc "bin/rails console"

routes: ## ルーティング表示
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bin/rails routes"

# ---- Tests / Lint (api) ---------------------------------------
test: ## (=rspec)
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rspec"

rspec: ## RSpec 実行のみ
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rspec"

rubocop: ## Lint チェック
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rubocop"

fmt: ## 自動整形（Aggressive: -A）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rubocop -A"

fmt-safe: ## 自動整形（Safe: -a）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rubocop -a"

lint-all: ## RuboCop → RSpec の順で実行
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rubocop && bundle exec rspec"

ci: ## CI用（lint-all と同じだが将来拡張用フック）
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle exec rubocop && bundle exec rspec"

# ---- Scaffolding (api) ----------------------------------------
rspec_install: ## RSpec の導入＆初期化
	$(COMPOSE) run --rm $(API_SVC) bash -lc "bundle add rspec-rails --group 'development,test' && bundle install && bundle exec rails g rspec:install"

spec_health: ## Health API の最小リクエストスペック追加
	$(COMPOSE) run --rm $(API_SVC) bash -lc "\
	  mkdir -p spec/requests/api/v1 && \
	  cat > spec/requests/api/v1/health_spec.rb <<'EOF'\n\
# frozen_string_literal: true\n\
require 'rails_helper'\n\
\n\
RSpec.describe 'Health API', type: :request do\n\
  describe 'GET /api/v1/health' do\n\
    it 'returns ok' do\n\
      get '/api/v1/health'\n\
      expect(response).to have_http_status(:ok)\n\
      body = JSON.parse(response.body)\n\
      expect(body['status']).to eq('ok')\n\
    end\n\
  end\n\
end\n\
EOF"

# ---- Web (Vite + React) ---------------------------------------
web-install: ## web の依存導入
	$(COMPOSE) run --rm $(WEB_SVC) bash -lc "npm ci || npm i"

web-dev: ## web の開発サーバ起動（ポート 5173）
	$(COMPOSE) up -d $(WEB_SVC) && $(COMPOSE) logs -f $(WEB_SVC)

web-build: ## web の本番ビルド
	$(COMPOSE) run --rm $(WEB_SVC) bash -lc "npm run build"
