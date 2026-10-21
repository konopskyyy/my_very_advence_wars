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

| Kod     | Nazwa                  | Opis                                                                                                                                                                              | Ukończone | Szczegóły          |
| ------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ------------------ |
| GRA-001 | Ekran główny gry (menu) | Pierwsza scena Phasera: menu z przyciskami „Gra", „Ustawienia" i zamykaniem gry. `Gra` prowadzi do sceny z polem bitwy na siatce heksów (tereny: równina, las, woda, góry, miasto; czołg do testów, ruch o jedno pole). `Ustawienia` otwiera scenę/panel ustawień. Krzyżyk w prawym górnym rogu zamyka grę (w webie brak okna — ukryty lub nieaktywny). |    [x]    | [[Interfejs#INTERF-001\|INTERF-001]] · [[ADR#ADR-003\|ADR-003]] |
| GRA-002 | Czołg nie wychodzi poza planszę + analiza statyczna | Mapa zna granice planszy (`terrainAt` zwraca `undefined` poza planszą), `canMoveTo` odrzuca cel `out-of-bounds`, testy brzegów i losowego spaceru. Klient ma analizę statyczną: `oxlint` (reguły typowe) + `tsc --noEmit`, obie w `make lint` i w buildzie. |    [x]    | [[MapaHeksagonalna#Granice planszy a ruch]] · [[Infrastruktura#Analiza statyczna klienta]] |

Praca nad ekranem głównym odbywa się na gałęzi `feat/main-menu-scene`.
