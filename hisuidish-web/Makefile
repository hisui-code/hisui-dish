# hisuidish-web/Makefile
ROOT := $(abspath ..)
COMPOSE := docker compose -f $(ROOT)/infra/docker/docker-compose.dev.yml

API := api
WEB := web

.PHONY: up down restart logs ps build install dev

# api + web を一括で起動（バックグラウンド）
up:
	$(COMPOSE) up -d $(API) $(WEB)

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