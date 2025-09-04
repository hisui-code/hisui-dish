COMPOSE = docker compose -f infra/docker/docker-compose.dev.yml

.PHONY: up down rebuild logs bash bundle db test

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

rebuild:
	$(COMPOSE) down -v
	$(COMPOSE) build --no-cache api
	$(COMPOSE) up -d
	$(COMPOSE) logs -f api

logs:
	$(COMPOSE) logs -f api

bash:
	$(COMPOSE) exec api bash -lc "bash"

bundle:
	$(COMPOSE) run --rm api bash -lc "bundle config set path '/usr/local/bundle' && bundle install"

db:
	$(COMPOSE) run --rm api bash -lc "bin/rails db:prepare"

test:
	$(COMPOSE) run --rm api bash -lc "bundle exec rails test || bundle exec rspec"