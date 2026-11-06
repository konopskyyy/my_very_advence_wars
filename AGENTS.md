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
make verify   # typy, testy, build i restart Vite; krótkie końcówki logów
```

Tylko przebudowa bez testów: `make client-build`. `make check` uruchamia same
typy i testy. Nie powtarzaj tych komend po każdej drobnej zmianie.

Cele `check`, `test`, `lint` i `client-build` przechodzą przez
`scripts/compact-run.sh`: na ekran idzie status i 20–40 końcowych linii, a pełny
log ląduje w `${TMPDIR:-/tmp}/opencode/mvaw` i jest kasowany po dobie. Gdy
końcówka nie wystarcza, `scripts/compact-run.sh --last` pokazuje ostatni log.
Nie czytaj logów w całości ani nie wklejaj ich do rozmowy — wystarczy status,
ścieżka i fragment.

HMR nie nadąża po zmianie struktury modułów (`core/map.ts` → `core/map/`),
a `client/dist` bywa starszy od kodu. Bez przebudowy przeglądarka pokazuje
starą wersję, a diagnoza zachowania jest myląca.

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
  Reguły i dane rozgrywki opisuje `specification/Zalozenia.md`.
  Nowe zadanie zakładasz w tabeli `Zadania.md` (ID, nazwa, status, powiązania)
  i w `Zadania-opisy.md` (kontekst, opis, kryteria) — bez powtarzania statusu
  w opisie.
- Kod gry (logika `core/` bez zależności od Phasera) — patrz ADR-001 w
  `specification/ADR.md`. Nie wiąż logiki gry z silnikiem.
- Nie commituj sekretów: `.env` i `server/.env` są w `.gitignore` i mają tam zostać.

## Oszczędzanie kontekstu

Pomiar z 12 sesji w tym repo (31.10–06.11): 558 wywołań `shell` dało
~1,28 mln znaków wyniku, a `read` — ~327 tys. Najdroższe były zrzuty
specyfikacji (84 wywołania, ~478 tys.), szerokie `grep -rn` (84, ~242 tys.)
i czytanie całych plików >8 tys. znaków (12, ~172 tys.). To rząd 200 tys.
tokenów, z których większość była do uniknięcia.

- **Nowy temat = nowa sesja.** Po zakończeniu zadania zacznij nową sesję
  zamiast ciągnąć jedną przez kilka funkcji. Każdy krok wysyła całą historię,
  więc długie sesje kosztują kwadratowo.
- **Czytaj punktowo.** Dokumenty mają ID sekcji (`ADR-022`, `ZAL-005`,
  `GRA-030`, `INTERF-005`). Nie znasz ID? `scripts/spec.sh --find "fraza"`
  zwraca tylko pliki i nagłówki pasujących sekcji. Potem `scripts/spec.sh ID`
  — jedna sekcja na wywołanie. Nie wczytuj całego `ADR.md`,
  `Zadania-opisy.md`, `Mapy.md` ani `Infrastruktura.md`.
- **Budżet wyniku ~8 tys. znaków.** Jeden `read` to max ~80 linii, jeden
  `grep`/`rg` — konkretny plik i wzorzec, nie całe drzewo. Większy wynik
  prawie zawsze oznacza, że najpierw trzeba było zawęzić zapytanie.
- **`grep -rn` tylko po wskazaniu plików.** Najpierw `grep -rl` albo
  narzędzie `grep` z `path`/`include`, potem `grep -n` w jednym pliku.
  `grep -rn ... | head -60` nie oszczędza: cały wynik i tak powstaje.
- **Zero `cat`/`sed` na całych dokumentach.** `cat docker-compose.yml`,
  `cat Makefile`, `sed -n '1,200p' specification/...` to zrzuty po 10–20 tys.
  znaków. Wybierz sekcję przez `scripts/spec.sh` albo zawęź `grep -n`.
- **Pliki >200 linii tylko wycinkami.** Najpierw `grep -n`, potem `read`
  z `offset`/`limit` (max ~80 linii) albo `sed -n`. Nie powtarzaj `read`
  tego samego pliku; po edycji wystarczy `git diff --stat`. Jeśli wynik
  narzędzia zostanie ucięty przez `tool_output`, dociągnij tylko brakujący
  zakres.
- **Diff tylko statystyką albo jednym plikiem.** `git diff --stat`,
  `git show --stat`; pełny diff dopiero dla pliku, którego dotyczy zmiana.
- **Grupuj narzędzia.** Niezależne odczyty, grepy i edycje wywołuj w jednym
  kroku. Testy, `tsc` i build uruchamiaj raz na partię zmian: `make verify`.
- **Testy przez `make`.** `make verify`/`make check`, backend przez
  `make test-server` (opakowany w `compact-run.sh`) zamiast
  `make test-server 2>&1 | tail -80`.
- **Nie czytaj artefaktów.** Pomijaj `client/dist/`, `client/node_modules/`,
  `server/vendor/`, `client/reports/` i locki; `opencode.jsonc` blokuje ich
  odczyt. Do sprawdzenia użyj `grep`.
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
- **Nie powtarzaj informacji.** Po edycji nie czytaj pliku od nowa i nie
  wklejaj outputu narzędzia do odpowiedzi; wystarczy ścieżka, numer linii
  i krótki wynik. Output narzędzi trafia do kontekstu nawet wtedy, gdy
  interfejs go zwija — ukrycie w UI samo z siebie nic nie oszczędza.
