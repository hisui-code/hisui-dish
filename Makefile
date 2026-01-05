# hisui-dish/Makefile
COMPOSE := docker compose -f infra/docker/docker-compose.dev.yml

.PHONY: up down ps logs api-shell api-test api-logs

up: ## 全サービス起動
	$(COMPOSE) up -d

down: ## 全サービス停止
	$(COMPOSE) down

ps: ## 状態確認
	$(COMPOSE) ps

logs: ## ログ確認
	$(COMPOSE) logs -f

api-shell: ## Laravel APIコンテナに入る
	$(COMPOSE) exec api-laravel bash

api-test: ## Laravel APIのテスト実行
	$(COMPOSE) exec api-laravel php artisan test

api-logs: ## Laravel APIのログ確認
	$(COMPOSE) logs -f api-laravel
