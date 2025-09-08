# hisui-dish/Makefile
COMPOSE := docker compose -f infra/docker/docker-compose.dev.yml

.PHONY: up down ps logs

up: ## 全サービス起動
	$(COMPOSE) up -d

down: ## 全サービス停止
	$(COMPOSE) down

ps: ## 状態確認
	$(COMPOSE) ps

logs: ## ログ確認
	$(COMPOSE) logs -f