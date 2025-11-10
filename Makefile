.PHONY: help up build rebuild down clear fsh bsh flog blog pr

# Default target
.DEFAULT_GOAL := help

# Tools
DC := docker compose

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_.-]+:.*## / {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	$(DC) up -d

build: ## Build and start
	$(DC) up --build -d

rebuild: ## Rebuild and force recreate, then start
	$(DC) up --build --force-recreate -d

down: ## Stop containers
	$(DC) down

clear: ## Stop and clear local images
	$(DC) down --volumes --rmi local

fsh: ## Frontend shell
	$(DC) exec next sh -i

bsh: ## Backend shell
	$(DC) exec go sh -i

flog: ## Frontend logs
	$(DC) logs next -f

blog: ## Backend logs
	$(DC) logs go -f

pr: ## Run pull_request gh action locally
	./bin/act pull_request
