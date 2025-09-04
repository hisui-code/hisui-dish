# ---- Config ----------------------------------------------------
COMPOSE := docker compose -f infra/docker/docker-compose.dev.yml
SERVICE ?= api
RUN  := $(COMPOSE) run --rm $(SERVICE) bash -lc
EXEC := $(COMPOSE) exec      $(SERVICE) bash -lc

.DEFAULT_GOAL := help
.PHONY: help up down restart rebuild logs tail ps bash sh bundle setup db db-prepare db-reset \
        test rspec rubocop fmt console routes migrate seed

# ---- Help ------------------------------------------------------
help: ## このヘルプ
	@echo "Usage: make <target>"
	@echo
	@awk 'BEGIN {FS":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---- Lifecycle -------------------------------------------------
up: ## コンテナ起動（バックグラウンド）
	$(COMPOSE) up -d

down: ## 停止＋ネットワーク維持
	$(COMPOSE) down

restart: ## apiだけ再起動
	$(COMPOSE) restart $(SERVICE)

rebuild: ## ボリューム初期化→ビルド→起動→ログ
	$(COMPOSE) down -v
	$(COMPOSE) build --no-cache $(SERVICE)
	$(COMPOSE) up -d
	$(COMPOSE) logs -f $(SERVICE)

ps: ## 稼働状況
	$(COMPOSE) ps

logs: ## apiのログをフォロー
	$(COMPOSE) logs -f $(SERVICE)

tail: logs ## (=logs)

# ---- Shell / one-off ------------------------------------------
bash: ## 稼働中コンテナに入る
	$(COMPOSE) exec $(SERVICE) bash

sh: ## 一回限りで入る（コンテナ未起動でもOK）
	$(COMPOSE) run --rm $(SERVICE) bash

# ---- Dependencies / Setup -------------------------------------
bundle: ## bundle install（コンテナ未起動でもOK）
	$(RUN) "bundle config set path '/usr/local/bundle' && bundle install"

setup: ## 初期セットアップ（bundle + db:prepare）
	$(RUN) "bundle config set path '/usr/local/bundle' && bundle install && bin/rails db:prepare"

# ---- DB --------------------------------------------------------
db: db-prepare ## (=db-prepare)

db-prepare: ## db作成＆マイグレーション
	$(RUN) "bin/rails db:prepare"

db-reset: ## DB初期化（危険）
	$(RUN) "bin/rails db:drop db:create db:migrate db:seed"

migrate: ## マイグレーションだけ
	$(RUN) "bin/rails db:migrate"

seed: ## シード投入
	$(RUN) "bin/rails db:seed"

# ---- App utilities --------------------------------------------
console: ## rails console
	$(EXEC) "bin/rails console"

routes: ## ルーティング表示
	$(RUN) "bin/rails routes"

# ---- Tests / Lint ---------------------------------------------
test: ## rails test（無ければrspec）
	$(RUN) "bundle exec rails test || bundle exec rspec"

rspec: ## rspecのみ実行
	$(RUN) "bundle exec rspec"

rubocop: ## Lint チェック
	$(RUN) "bundle exec rubocop"

fmt: ## 自動整形（可能な範囲）
	$(RUN) "bundle exec rubocop -A"