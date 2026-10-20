# Zadania

Zadania projektowe, pogrupowane według kategorii. Status aktualizujemy na bieżąco.

Legenda: `[ ]` do zrobienia · `[x]` zrobione

---

## Infrastruktura

| Kod       | Nazwa                             | Opis                                                                                                                                  | Ukończone | Szczegóły                |
| --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ------------------------ |
| INFRA-001 | Środowisko deweloperskie (Docker) | `docker-compose.yml` z serwisami: `client` (Vite + Phaser), `server` (nginx + PHP-FPM), `db` (MySQL 8.4), `adminer` (profil `tools`). |    [x]    | [[ADR#ADR-001\|ADR-001]] |

## Backend

| Kod         | Nazwa                            | Opis                                                                                                                                        | Ukończone | Szczegóły         |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----------------- |
| BACKEND-001 | Szkielet Symfony + kontroler     | Pusty serwis Symfony 8.1 (php-fpm) z kontrolerem `HomeController` zwracającym JSON — smoke-test nginx → php-fpm → Symfony.                   |    [x]    | [[ADR#ADR-001\|ADR-001]] |

## Desktop (Electron)

| Kod         | Nazwa                 | Opis                                                                                                                                     | Ukończone | Szczegóły                |
| ----------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ------------------------ |
| DESKTOP-001 | Placeholder Electrona | `electron/` z `main.cjs` (okno ładuje Vite dev albo `client/dist`) i `preload.cjs` (contextIsolation). Budowany na hoście, poza compose. |    [x]    | [[ADR#ADR-001\|ADR-001]] |

## Gra

| Kod  | Nazwa | Opis | Ukończone | Szczegóły |
| ---- | ----- | ---- | :-------: | --------- |
| GRA- |       |      |           |           |
