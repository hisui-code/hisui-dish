# hisuidish-web/Makefile
ROOT := $(abspath ..)
COMPOSE := docker compose -f $(ROOT)/infra/docker/docker-compose.dev.yml

API := api
WEB := web
DB := db

.PHONY: up down restart logs ps build install dev

# api + web を一括で起動（バックグラウンド）
up:
	$(COMPOSE) up -d $(API) $(WEB)  $(DB)

# まとめて停止
down:
	$(COMPOSE) down

# web だけ再起動
restart:
	$(COMPOSE) restart $(WEB)

# web のログを見る
logs:
	$(COMPOSE) logs -f $(WEB)

# 稼働状況
ps:
	$(COMPOSE) ps

# web イメージだけビルド
build:
	$(COMPOSE) build $(WEB)

# 依存導入（初回/更新時）
install:
	$(COMPOSE) run --rm $(WEB) npm install

# web を起動してログを追う（お好みで）
dev:
	$(COMPOSE) up -d $(WEB) && $(COMPOSE) logs -f $(WEB)

# 疎通確認
health:
	curl -i http://localhost:3000/api/v1/health || true

# web-dev（エイリアス）
web-dev: dev
	@echo "🚀 Starting web (Vite) in development mode..."

# git
diff:
	@git diff

# Web コンテナ内で diff
diff-web:
	@$(COMPOSE) exec web sh -lc "git diff || (apk add --no-cache git >/dev/null 2>&1 && git diff)"
