# AGENTS.md

Monorepo gry *My Very Advance Wars*: `client/` (TypeScript + Phaser + Vite),
`server/` (Symfony, patrz `server/AGENTS.md`), `electron/` (opakowanie desktopowe),
`docker/` + `docker-compose.yml` (środowisko deweloperskie).

Uruchamianie przez `Makefile` w katalogu głównym — `make help` listuje cele.
Compose czyta `.env` (porty i hasła); wartości domyślane są w `docker-compose.yml`.

## Dokumentacja infrastruktury — obowiązek

`specification/Infrastruktura.md` opisuje **faktyczny stan** infrastruktury
(serwisy, porty, woluminy, zmienne, cele Makefile). Ta notatka i kod muszą się
zgadzać.

Przy **każdej** zmianie infrastruktury zaktualizuj ten dokument **w tym samym
commicie**. Za „zmianę infrastruktury" uznaj:

- `docker-compose.yml` — serwisy, porty, woluminy, zmienne środowiskowe,
- `docker/php/Dockerfile` i `docker/nginx/default.conf`,
- `Makefile` — nowe/usunięte cele,
- `.github/workflows/` — zakres, wyzwalacze i kroki pipeline'u CI,
- `electron/` — sposób uruchamiania i budowania,
- `.env.example` — nowe zmienne.

Kolejność poprawki: najpierw sekcje „Mapa sieci i portów" i „Codzienna praca"
(najszybciej się dezaktualizują), potem pozostałe sekcje, na końcu callouty
w „Rozwiązywanie problemów" (stare porty i polecenia). Nie zostawiaj
nieaktualnych numerów portów — czytelnik wpisze je do terminala.

## Przebudowa aplikacji po zmianach — obowiązek

Po zmianach w `client/` przebuduj aplikację, żeby użytkownik widział aktualny
stan. Zmiany zbieraj w serię i przebudowuj **raz na końcu**, nie po każdym
drobiazgu:

```bash
cd client && npm run build 2>&1 | tail -n 20   # odświeża client/dist (Electron ładuje ten katalog)
docker compose restart client                  # Vite rozwiązuje importy od nowa
```

Nie wklejaj pełnego logu builda do rozmowy — wystarczy końcówka albo kod
wyjścia. HMR nie nadąża po zmianie struktury modułów (`core/map.ts` →
`core/map/`), a `client/dist` bywa starszy od kodu. Bez tego przeglądarka
pokazuje starą wersję, a diagnoza zachowania jest myląca.

## Komentarze — tylko gdy wnoszą wiedzę

Domyślnie **nie pisz komentarzy**. Kod ma się tłumaczyć sam nazwami. Komentarz
jest uzasadniony tylko wtedy, gdy wyjaśnia **dlaczego** coś jest zrobione wbrew
oczywistości — czego nie da się odczytać z kodu.

Pisz komentarz, gdy:
- obejście/niespodzianka (np. wolumin nadpisuje `vendor/`, więc autoload znika),
- wybór sprzeczny z intuicją (np. port niestandardowy celowo),
- ograniczenie zewnętrzne (wersja biblioteki, zachowanie frameworka).

Nie pisz komentarzy, które:
- powtarzają kod (`// ustaw tytuł okna` nad `title: ...`),
- opisują oczywiste (`// import zależności`, `// funkcja tworzy okno`),
- są nagłówkiem pliku streszczającym to, co widać w pierwszym akapicie kodu,
- tłumaczą składnię języka.

Sekcje w `docker-compose.yml`/`Makefile` dzielone komentarzem są OK — ale krótko
i tylko tam, gdzie naprawdę pomagają nawigować. Przy edycji istniejącego kodu
usuń komentarze, które przestały być prawdą.

## Git — nie merguj do `master`

- `master` przyjmuje wyłącznie commity użytkownika. Pracuj na osobnym branchu
  (`feat/…`, `fix/…`, `chore/…`) i zostaw go do ręcznego merge.
- **Nigdy nie merguj do `master`** — ani przez `git merge`, ani przez fast-forward,
  ani przez `git pull --no-ff`. Nie pushuj `master` zdalnie.
- Nie resetuj i nie usuwaj historii `master` (`git reset --hard`, `git push --force`).
- Commity po polsku, styl conventional (`feat:`, `fix:`, `chore:`).
- Opis commita mówi **co zostało zrobione**, a nie co należy zrobić —
  rzeczownikowo, nie w trybie rozkazującym. Dotyczy całej treści po typie.
  - dobrze: `chore: wydzielenie testów klienta do tests/ z lustrzanym drzewem`,
  - źle: `chore: wydziel testy klienta do tests/ z lustrzanym drzewem`.

## Inne konwencje

- **Testy klienta w `client/tests/`** — drzewo lustrzane do `client/src/`; test
  `src/core/map/model.ts` to `tests/core/map/model.test.ts`. Nie dodawaj plików
  `*.test.ts` w `src/`. Szczegóły: `specification/Konwencje.md`, decyzja:
  ADR-008.
- **Najpierw dokumentacja, potem kod.** Zadania, których nie ma w
  `specification/Zadania.md` (albo interfejsu, którego nie ma w
  `specification/Interfejs.md`), nie się robi. Nową pracę zaczynaj od wpisu
  w dokumentacji, a potem implementuj — inaczej kod wyprzedza specyfikację.
  Nowe zadanie zakładasz w tabeli `Zadania.md` (ID, nazwa, status, powiązania)
  i w `Zadania-opisy.md` (kontekst, opis, kryteria) — bez powtarzania statusu
  w opisie.
- Kod gry (logika `core/` bez zależności od Phasera) — patrz ADR-001 w
  `specification/ADR.md`. Nie wiąż logiki gry z silnikiem.
- Nie commituj sekretów: `.env` i `server/.env` są w `.gitignore` i mają tam zostać.

## Oszczędzanie kontekstu

- **Czytaj punktowo.** Dokumenty mają ID sekcji (`ADR-022`, `GRA-030`,
  `INTERF-005`). Najpierw `grep`, potem wycinek przez `sed -n`; nie wczytuj
  całego `ADR.md` ani `Mapy.md`.
- **Nie czytaj artefaktów.** Pomijaj `client/dist/`, `client/node_modules/`,
  `server/vendor/` i `package-lock.json`; do sprawdzenia użyj `grep`.
- **Jedno źródło opisu zadania.** Status i powiązania są w
  `specification/Zadania.md`, pełny opis i kryteria wyłącznie w
  `specification/Zadania-opisy.md`. Nie kopiuj treści między plikami.
- **Edycje punktowe w dokumentacji.** Zmieniaj tylko sekcję, której dotyczy
  praca (`edit`), nie przepisuj całego pliku. Nowe treści dopisuj na końcu.
- **Wielkie pliki dziel.** Scena albo moduł powyżej ~500 linii utrudnia
  czytanie i generuje duże diffy — wydzielaj HUD, panele i obsługę inputu do
  `view/`.
- **Odpowiedzi bez kodu.** Nie wklejaj całych plików ani diffów; podawaj
  ścieżki, numery linii i krótki fragment tylko wtedy, gdy bez niego nie da się
  zrozumieć decyzji. Logi builda i testów skracaj do końcówki.
- **Narzędzia filtruj.** `git diff --stat`, `tail`, `grep` zamiast `cat`
  i pełnych diffów. Output narzędzi trafia do kontekstu nawet wtedy, gdy
  interfejs go zwija — ukrycie w UI samo z siebie nic nie oszczędza.
