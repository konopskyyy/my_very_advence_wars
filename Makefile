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
        shell console composer cache-clear migrate fixtures jwt-keys test-server \
        db-shell build rebuild client-install \
        install hooks electron electron-build electron-win electron-win-installer clean clean-all test mutation lint env run quality quality-client \
        check client-build verify

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

migrate: ## Wykonaj migracje Doctrine
	$(COMPOSE) exec server php bin/console doctrine:migrations:migrate --no-interaction

fixtures: ## Załaduj fixtury deweloperskie (czyści tabele)
	$(COMPOSE) exec server php bin/console doctrine:fixtures:load --no-interaction

jwt-keys: ## Wygeneruj parę kluczy JWT
	$(COMPOSE) exec server php bin/console lexik:jwt:generate-keypair --overwrite --no-interaction

test-server: ## Testy backendu (PHPUnit, krótka końcówka)
	@scripts/compact-run.sh --label test-server -- $(COMPOSE) exec server php bin/phpunit

db-shell: ## MySQL CLI w kontenerze bazy
	$(COMPOSE) exec db sh -c 'mysql -u"$${MYSQL_USER}" -p"$${MYSQL_PASSWORD}" "$${MYSQL_DATABASE}"'

## ——— Build ——————————————————————————————————————————————

build: ## Przebuduj obrazy (po zmianie Dockerfile)
	$(COMPOSE) build

rebuild: ## Przebuduj bez cache i podnieś od nowa
	$(COMPOSE) build --no-cache && $(COMPOSE) up -d

client-install: ## Zainstaluj zależności klienta na hoście (opcjonalne)
	cd client && npm install

install: hooks ## Skopiuj .env.example -> .env (jeśli brak) i zainstaluj hooki git
	@test -f .env || cp .env.example .env
	@echo "Plik .env gotowy. Uruchom 'make up'."

hooks: ## Zainstaluj hooki git (Husky)
	npm install

## ——— Electron (na hoście, poza compose) ———————————————————

electron: ## Uruchom Electrona (dev: ładuje Vite z kontenera)
	$(ELECTRON) start --prefix electron

run: electron ## Uruchom Electrona (alias make electron)

electron-build: ## Zbuduj klienta i rozpakowaną paczkę Electrona (bieżący system)
	cd client && npm run build
	$(ELECTRON) run build --prefix electron

electron-win: ## Zbuduj klienta i paczkę ZIP dla Windows (WSL, bez wine)
	cd client && npm run build
	$(ELECTRON) run build:win --prefix electron

electron-win-installer: ## Zbuduj instalator NSIS dla Windows (wymaga wine)
	cd client && npm run build
	$(ELECTRON) run build:win:installer --prefix electron

## ——— Testy / porządek ——————————————————————————————————————

test: ## Testy klienta (Vitest, krótka końcówka)
	@scripts/compact-run.sh --label test bash -c 'cd client && npm test'

check: ## Typy i testy klienta (krótkie końcówki, pełny log w tmp)
	@scripts/compact-run.sh --label check bash -c 'cd client && npx tsc --noEmit && npm test'

client-build: ## Zbuduj klienta i zrestartuj Vite
	@scripts/compact-run.sh --label build bash -c 'cd client && npm run build'
	@scripts/compact-run.sh --label vite bash -c '$(COMPOSE) restart client'

verify: check client-build ## Typy, testy, build i restart Vite (jedno polecenie)

mutation: ## Testy mutacyjne klienta (Stryker)
	cd client && npm run mutation

lint: ## Sprawdź typy klienta (krótka końcówka)
	@scripts/compact-run.sh --label lint bash -c 'cd client && npx tsc --noEmit'

quality-client: ## Ocena jakości kodu klienta (typy, zależności, martwy kod, duplikaty)
	cd client && npm run quality

quality: quality-client ## Ocena jakości (alias)

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
