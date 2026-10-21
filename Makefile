# Dodajesz/zmieniasz cel? Zaktualizuj specification/Infrastruktura.md w tym samym commicie.

COMPOSE ?= docker compose
ELECTRON ?= npm

# Porty z .env (domyślne zgodne z docker-compose.yml), do wydruku w helpie.
CLIENT_PORT  ?= 18573
BACKEND_PORT ?= 18080
DB_PORT      ?= 13306
ADMINER_PORT ?= 18081

.DEFAULT_GOAL := help

.PHONY: help up up-tools down stop restart ps logs logs-server logs-client \
        shell console composer cache-clear db-shell build rebuild client-install \
        install setup deps check electron electron-build run clean clean-all test lint \
        typecheck env

## ——— Pomoc ————————————————————————————————————————————————

help: ## Lista celów
	@echo "Dostępne cele (make <cel>):"
	@echo
	@awk 'BEGIN {FS = ":.*## "} \
		/^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	@echo
	@echo "Porty (zmień w .env): client=$(CLIENT_PORT) backend=$(BACKEND_PORT) db=$(DB_PORT) adminer=$(ADMINER_PORT)"

## ——— Start / stop ————————————————————————————————————————

up: ## Uruchom całe środowisko (tło)
	$(COMPOSE) up -d

up-tools: ## Uruchom środowisko + adminer (panel bazy)
	$(COMPOSE) --profile tools up -d

down: ## Zatrzymaj i usuń kontenery (woluminy zostają)
	$(COMPOSE) down

stop: ## Zatrzymaj kontenery (bez usuwania)
	$(COMPOSE) stop

restart: ## Restart wszystkich serwisów
	$(COMPOSE) restart

## ——— Podgląd ————————————————————————————————————————————

ps: ## Status kontenerów
	$(COMPOSE) ps

logs: ## Logi wszystkich serwisów (na żywo)
	$(COMPOSE) logs -f

logs-server: ## Logi backendu (na żywo)
	$(COMPOSE) logs -f server

logs-client: ## Logi klienta Vite (na żywo)
	$(COMPOSE) logs -f client

## ——— Backend (Symfony / PHP) ——————————————————————————————

shell: ## Shell w kontenerze backendu
	$(COMPOSE) exec server sh

console: ## Konsola Symfony (make console about)
	$(COMPOSE) exec server php bin/console $(filter-out $@,$(MAKECMDGOALS))

composer: ## Zainstaluj zależności PHP (wypełnia wolumin vendor)
	$(COMPOSE) exec server composer install

cache-clear: ## Wyczyść cache Symfony
	$(COMPOSE) exec server php bin/console cache:clear

db-shell: ## MySQL CLI w kontenerze bazy
	$(COMPOSE) exec db sh -c 'mysql -u"$${MYSQL_USER}" -p"$${MYSQL_PASSWORD}" "$${MYSQL_DATABASE}"'

## ——— Instalacja / setup dev ————————————————————————————————

check: ## Sprawdź wymagane narzędzia (docker, docker compose, node, npm)
	@command -v docker >/dev/null 2>&1 || { echo "Brak 'docker'."; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "Brak 'docker compose' (v2)."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Brak 'node'."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Brak 'npm'."; exit 1; }
	@echo "OK: docker, docker compose, node, npm"

install: setup ## Alias: pełna instalacja dev

deps: ## Zainstaluj zależności na hoście (client + electron)
	@echo "==> Instaluję zależności klienta..."
	cd client && npm install
	@echo "==> Instaluję zależności Electrona..."
	cd electron && npm install

setup: check ## Pełne przygotowanie dev: .env + build + start + composer + deps
	@test -f .env || (cp .env.example .env && echo "Utworzono .env z .env.example")
	@echo "==> Buduję obrazy..."
	$(COMPOSE) build
	@echo "==> Uruchamiam kontenery..."
	$(COMPOSE) up -d
	@echo "==> Czekam na gotowość bazy..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do \
		if $(COMPOSE) exec -T db sh -c 'mysqladmin ping -h 127.0.0.1 -u"$${MYSQL_USER:-app}" -p"$${MYSQL_PASSWORD:-app}" --silent' >/dev/null 2>&1 || $(COMPOSE) exec -T db sh -c 'mysqladmin ping -h 127.0.0.1 -uroot -p"$${MYSQL_ROOT_PASSWORD:-root}" --silent' >/dev/null 2>&1; then break; fi; \
		sleep 2; \
	done
	@echo "==> Instaluję zależności PHP (composer) w woluminie server_vendor..."
	$(COMPOSE) exec server composer install --no-interaction --prefer-dist
	@echo "==> Przygotowuję plik .env dla Symfony..."
	$(COMPOSE) exec server sh -c 'test -f .env || cp .env.dev .env'
	@echo "==> Czyszczę cache Symfony..."
	$(COMPOSE) exec server php bin/console cache:clear >/dev/null 2>&1 || true
	@$(MAKE) deps
	@echo
	@echo "Gotowe:"
	@echo "  Klient (Vite): http://localhost:$(CLIENT_PORT)"
	@echo "  Backend (nginx): http://localhost:$(BACKEND_PORT)"
	@echo "  Adminer (opcjonalny): make up-tools -> http://localhost:$(ADMINER_PORT)"

## ——— Build ——————————————————————————————————————————————

build: ## Przebuduj obrazy (po zmianie Dockerfile)
	$(COMPOSE) build

rebuild: ## Przebuduj bez cache i podnieś od nowa
	$(COMPOSE) build --no-cache && $(COMPOSE) up -d

client-install: deps ## Alias: zależności klienta + electron na hoście

## ——— Electron (na hoście, poza compose) ———————————————————

electron: ## Uruchom Electrona (dev: ładuje Vite z kontenera)
	$(ELECTRON) start --prefix electron

run: ## Zbuduj klienta i uruchom Electrona na dist (bez Dockera)
	cd client && npm run build
	$(ELECTRON) run start:dist --prefix electron

electron-build: ## Zbuduj klienta i paczkę Electrona
	cd client && npm run build
	$(ELECTRON) run build --prefix electron

## ——— Testy / porządek ——————————————————————————————————————

test: ## Testy klienta (Vitest)
	cd client && npm test

lint: ## Analiza statyczna klienta (oxlint + typy TypeScript)
	cd client && npm run check

typecheck: ## Sprawdź typy klienta (TypeScript)
	cd client && npm run typecheck

clean: ## Zatrzymaj kontenery i usuń woluminy (⚠️ kasuje dane bazy)
	$(COMPOSE) down -v

clean-all: clean ## clean + usuń zbudowane obrazy
	$(COMPOSE) down -v --rmi local

env: ## Pokaż wykryte porty z .env
	@echo "client=$(CLIENT_PORT) backend=$(BACKEND_PORT) db=$(DB_PORT) adminer=$(ADMINER_PORT)"

# Przechwycenie argumentów dla `make console <args>` — żeby make nie traktował
# ich jako celów.
%:
	@:
