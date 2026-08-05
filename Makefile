COMPOSE ?= docker compose
COMPOSE_PROJECT_NAME ?= nextjs-starter
COMPOSE_ENV_FILE ?= .env

COMPOSE_BASE = $(COMPOSE) --project-name $(COMPOSE_PROJECT_NAME) --env-file $(COMPOSE_ENV_FILE) -f compose.yaml
COMPOSE_DEV = $(COMPOSE_BASE) -f compose.dev.yaml
COMPOSE_PROD = $(COMPOSE_BASE) -f compose.prod.yaml

.PHONY: \
	compose-build-dev \
	compose-build-prod \
	compose-config-dev \
	compose-config-prod \
	compose-dev \
	compose-down \
	compose-logs \
	compose-prod \
	compose-ps

compose-build-dev:
	$(COMPOSE_DEV) build nextjs

compose-build-prod:
	$(COMPOSE_PROD) build nextjs

compose-config-dev:
	$(COMPOSE_DEV) config --quiet

compose-config-prod:
	$(COMPOSE_PROD) config --quiet

compose-dev:
	$(COMPOSE_DEV) up --build --remove-orphans

compose-prod:
	$(COMPOSE_PROD) up --build --detach --wait --wait-timeout 180 --remove-orphans

compose-logs:
	$(COMPOSE_BASE) logs --follow

compose-ps:
	$(COMPOSE_BASE) ps

compose-down:
	$(COMPOSE_BASE) down --remove-orphans --volumes
