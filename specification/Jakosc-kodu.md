# Jakość kodu

Analiza narzędzi do oceny jakości i sposób porównywania kolejnych podejść.
Pomiar jest **ręczny, z terminala** (`make metrics`) — CI nadal sprawdza tylko
typy, testy i mutacje, żeby nie wydłużać pipeline'u o metryki trendu.

## JAK-001: Cel i zakres

Cel: odpowiedzieć, które narzędzia warto mieć, żeby mierzyć **czasy budowania,
największe pliki, liczbę odpowiedzialności modułu, pokrycie testami i mutacje** —
oraz mieć tabelę, która po kilku podejściach pokaże, czy jakość rośnie.

Zakres: klient (`client/`) i backend (`server/`) w zakresie, w jakim narzędzia już
są w repo lub wymagają decyzji. Dokument nie wdraża narzędzi — opisuje stan,
progi i procedurę; wdrożenie to osobne zadania.

## JAK-002: Stan obecny

| Obszar | Narzędzie | Zakres | Komenda | W CI |
| --- | --- | --- | --- | --- |
| Typy | `tsc --noEmit` (strict, `noUnusedLocals`) | `client/src`, `tests` | `make lint` | ✅ |
| Testy | Vitest | `client/tests/` | `make test` | ✅ |
| Mutacje | Stryker (`vitest`, `coverageAnalysis: perTest`) | `client/src/core/**` | `make mutation` | ✅ |
| Pokrycie | — (brak `@vitest/coverage-v8`) | — | — | ❌ |
| Lint / złożoność | — (brak ESLint/Biome) | — | — | ❌ |
| Cykle i sieroty | dependency-cruiser 17.4.3 | `client/src` | `make quality-client` | ❌ |
| Martwe eksporty | `ts-prune` | `client/src` | `make quality-client` | ❌ |
| Duplikaty | jscpd (`threshold: 30`) | `client/src`, `tests` | `make quality-client` | ❌ |
| Rozmiar i złożoność | — | — | — | ❌ |
| Czasy i bundle | — | — | — | ❌ |
| Typy backendu | Psalm (poziom 4) | `server/src`, `tests` | brak celu | ❌ |
| Styl backendu | phpcs | `server/src` | brak celu | ❌ |
| Mutacje backendu | Infection (`minMsi 80`, `minCoveredMsi 90`) | `server/src` | `vendor/bin/infection` | ✅ |
| Metryki na żądanie | `scripts/metrics.sh` | klient + raporty | `make metrics` | ❌ (celowo) |

**Sprawozdanie**

- Klient ma solidne fundamenty: strict TypeScript, Vitest i mutacje na `core/`.
  Mutacje są najlepszym dostępnym sygnałem jakości asercji — 80,4% z ostatniego
  przebiegu (GRA-034) przy progu `break 50` daje 30 punktów zapasu, więc próg
  nie chroni przed regresją.
- Brakuje trzech rzeczy z punktu wyjściowego: **pokrycia**, **miar rozmiaru
  i odpowiedzialności** oraz **czasów**. Bez nich nie da się odpowiedzieć, czy
  refaktor (np. rozbicie `recruitDialog.ts`) faktycznie pomógł.
- `make quality-client` istnieje, ale w chwili analizy `node_modules` było
  niezgodne z lockiem: brakowało `dependency-cruiser`, `jscpd` i `ts-prune`.
  Po `npm ci` narzędzia wróciły. To pokazuje, że cele jakości nie są częścią
  codziennego obiegu — łatwo je przeoczyć.
- **dependency-cruiser z TypeScript 7 zwraca 0 modułów** (`0 modules,
  0 dependencies cruised`), mimo że pliki istnieją. TypeScript 7 (kompilator
  natywny) nie udostępnia API JS, na którym opiera się parser narzędzia — ten
  sam problem obejliśmy w Strykerze nieistniejącym `tsconfig`.
- Psalm i phpcs są skonfigurowane w `server/`, ale nie ma dla nich celu
  w `Makefile` ani joba w CI — konfiguracja istnieje tylko na papierze.

## JAK-003: Porównanie narzędzi

| Narzędzie | Co mierzy | Koszt wdrożenia | Ryzyko | Decyzja |
| --- | --- | --- | --- | --- |
| `@vitest/coverage-v8` | pokrycie linii/gałęzi | `npm i` + skrypt + próg | niskie (V8, bez API TS) | **must-have** |
| Biome (`noExcessiveCognitiveComplexity`) | złożoność poznawcza, nieużywane importy | `npm i` + config; formatter osobno | niskie (parser Rust) | **must-have** (tylko lint) |
| `scripts/metrics.sh` + `make metrics` | czasy, bundle, linie, eksporty, MSI | brak zależności | niskie | **wdrożone** |
| Psalm + phpcs | typy i styl backendu | 0 (już w repo), tylko cel `make` | niskie | **must-have** |
| Stryker | mutacje `core/` | jest; podniesienie progu | niskie | **podnieść próg** |
| jscpd | duplikaty | jest; `threshold` 30 → 5 | niskie | **zaostrzyć** |
| dependency-cruiser | cykle, sieroty, fan-in/fan-out | jest, ale nie działa z TS 7 | wysokie (0 modułów) | **naprawić lub wyłączyć** |
| ESLint + typescript-eslint | lint, complexity | wysoki | wysokie (brak API TS 7) | **odrzucone do czasu wsparcia** |
| `ts-prune` | martwe eksporty | jest, ale zależny od API TS | średnie | **zastąpić** `tsc` + Knip po testach |
| Knip | martwe eksporty i zależności | `npm i` | średnie (TS 7?) | opcjonalne |
| `rollup-plugin-visualizer` / `size-limit` | budżet bundla | `npm i` + config | niskie | opcjonalne |
| `hyperfine` / `scc` / `tokei` | benchmarki i linie | binarka poza npm | niskie | odrzucone (skrypt wystarcza) |
| PHPStan | typy backendu | duplikat Psalma | średnie | odrzucone |
| SonarQube / CodeClimate | platforma metryk | wysoki (serwer/konto) | wysokie | odrzucone |

**Sprawozdanie**

- **Must-have** to narzędzia, które dają nowy sygnał niskim kosztem: pokrycie
  (V8 nie dotyka API TypeScriptu), Biome (własny parser, więc działa z TS 7)
  oraz uruchomienie Psalma i phpcs, które już leżą w repo. Do tego zaostrzenie
  progów Strykera i jscpd — to zmiana konfiguracji, nie nowa zależność.
- **`make metrics`** jest jedynym elementem wdrożonym od razu: zbiera liczby
  bez nowych pakietów i nie obciąża CI. Świadomie mierzy `vite build` osobno od
  typów, bo to dwa różne koszty.
- **Odrzucone**: ESLint z typescript-eslint powtórzyłby problem Strykera
  (TypeScript 7 bez API JS), a SonarQube/CodeClimate to ciężka infrastruktura
  przy jednym deweloperze. `hyperfine`/`scc` dają ładniejsze raporty, ale
  `date` + `git ls-files` w zupełności wystarczają do trendu.
- **dependency-cruiser** jest w zawieszeniu: dopóki nie ma wsparcia TS 7,
  traktujemy jego „0 naruszeń” jako brak danych, nie jako sukces. Do czasu
  naprawy metrykę pokazujemy jako `—`.

## JAK-004: Progi

| Metryka | Próg | Egzekwowanie |
| --- | --- | --- |
| Max linii w pliku | 400 (miękki), 500 (twardy) | przegląd + `make metrics` |
| Max eksportów w pliku | 12 | przegląd + `make metrics` |
| Złożoność poznawcza funkcji | 15 | Biome (lint) |
| Pokrycie linii `core/` | ≥ 80% | `npm run coverage` (próg w Vitest) |
| MSI klient | `break 70`, `high 85` | Stryker (CI) |
| MSI serwer | `minMsi 80`, `minCoveredMsi 90` | Infection (CI) |
| Duplikaty | ≤ 5% | jscpd (`threshold: 5`) |
| Bundle JS | ≤ 1600 KiB | `make metrics` + `size-limit` (opcjonalnie) |
| Naruszenia zależności | 0 | dependency-cruiser po naprawie TS 7 |
| Typy i styl backendu | 0 błędów | Psalm + phpcs (`make lint-server`) |
| Build klienta | ≤ 10 s | `make metrics` (miękki) |
| Typy klienta | ≤ 3 s | `make metrics` (miękki) |
| Testy klienta | ≤ 10 s | `make metrics` (miękki) |

**Sprawozdanie**

- Progi rozmiaru wynikają z obecnego stanu: 3 pliki przekraczają 500 linii
  (`recruitDialog.ts` 662, `ScenarioScene.ts` 589, `scenarioCommandBar.ts` 518),
  więc twardy próg 500 dotyczy tylko nowych plików, a istniejące dostają zadanie
  rozbicia. Limit eksportów 12 bierze się z `core/map/model.ts` (16).
- Próg pokrycia dotyczy wyłącznie `core/` — `scenes/` i `view/` są zależne od
  Phasera i testowanie ich jednostkowo kosztowałoby więcej niż daje.
- MSI klienta podnosimy dopiero po ustabilizowaniu zestawu testów: `break 70`
  jest bezpieczne przy 80,4%, a `high 85` wyznacza kierunek. Nie podnosimy
  od razu do 80, bo pojedynczy timeout mutanta nie powinien blokować commita.
- Progi czasu są miękkie — służą do wykrywania skoków (np. po dodaniu ciężkiej
  zależności), nie do blokowania pracy.

## JAK-005: Pomiary

| # | Data | Commit | Typy (s) | Testy (s) | Build (s) | Bundle JS (KiB) | Pokrycie core (%) | MSI klient (%) | MSI serwer (%) | Max plik (linie) | Eksporty (max) | Duplikaty (%) | Naruszenia depcruise |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 2026-11-10 | 8cc0055 | 0,8 | 1,8 | 1,6 | 1479,5 | — | 80,4 | — | 662 | 16 | 2,8 | — |

**Sprawozdanie**

- **Czasy** są krótkie, ale zmienne: przy zimnym cache testy trwały 5,0 s,
  przy ciepłym 1,8 s. Dlatego porównujemy serie wykonane na tej samej maszynie
  i w podobnych warunkach; pojedynczy pomiar to tylko punkt odniesienia.
- **Bundle** 1479,5 KiB to suma plików `.js` z `dist` bez gzip; dominuje Phaser.
  Budżet 1600 KiB zostawia niewiele miejsca, więc każda nowa zależność runtime
  powinna być świadomą decyzją.
- **Pokrycie** jest `—`, bo `@vitest/coverage-v8` nie ma w `package-lock.json`.
  To najbardziej odczuwalna luka — bez pokrycia nie wiadomo, które gałęzie
  `core/` są w ogóle dotykane przez testy.
- **MSI 80,4%** pochodzi z ostatniego raportu Strykera (`reports/mutation.json`),
  a nie z przebiegu wykonanego podczas tego pomiaru. Pełny przebieg uruchamia
  `make metrics-mutation`.
- **Rozmiar**: 662 linie w `recruitDialog.ts` to największy plik w repo; dalej
  `ScenarioScene.ts` (589), `scenarioCommandBar.ts` (518), `unitLayer.ts` (370)
  i `editorMenu.ts` (364). Najwięcej eksportów ma `core/map/model.ts` (16) —
  to sygnał szerokiego API modułu, niekoniecznie błąd.
- **Duplikaty 2,8%** przy progu 30% oznacza, że próg nic nie robi. Po zaostrzeniu
  do 5% każdy nowy klon będzie widoczny.
- **dependency-cruiser** pokazuje `—`, bo analizuje 0 modułów (TS 7). To nie jest
  brak naruszeń — to brak danych.

## JAK-006: Podejścia

| Podejście | Co zmieniono | Wynik | Koszt |
| --- | --- | --- | --- |
| 0. Stan wyjściowy | `tsc`, Vitest, Stryker, jscpd, ts-prune, depcruise | niepełny obraz: brak pokrycia, czasów i rozmiaru | 0 |
| 1. Pomiar na żądanie | `scripts/metrics.sh` + `make metrics` | powtarzalny wiersz i raport `client/reports/metrics.md` | 0 zależności |
| 2. Pokrycie | `@vitest/coverage-v8` + próg 80% dla `core/` | kolumna pokrycia wypełniona | `npm i` |
| 3. Złożoność | Biome z `noExcessiveCognitiveComplexity` | lista funkcji ponad próg 15 | konfiguracja lint |
| 4. Backend | `make lint-server` (Psalm + phpcs) | dług typów i stylu w tabeli | 0 (już w repo) |
| 5. ESLint + typescript-eslint | — | odrzucone: brak API TS 7 | wysoki |
| 6. SonarQube/CodeClimate | — | odrzucone: nadmiar przy jednym deweloperze | wysoki |

**Sprawozdanie**

- Podejście 1 jest wdrożone i wystarcza do porównań: każde kolejne uruchomienie
  dopisuje wiersz do JAK-005, a różnice opisuje Sprawozdanie. Nie trzeba do tego
  nowych pakietów.
- Podejścia 2–4 są niezależne i można je wdrażać pojedynczo; każde dodaje jedną
  kolumnę, więc tabela rośnie bez przebudowy.
- Podejścia 5 i 6 zapisujemy jako odrzucone, żeby nie wracać do nich bez zmiany
  okoliczności (wsparcie TS 7 w typescript-eslint albo praca w zespole).

## JAK-007: Procedura pomiaru

1. Uruchom `make metrics` w katalogu głównym (około 15 s; pełny Stryker:
   `make metrics-mutation`, około 4 min).
2. Skopiuj wiersz z końcówki do tabeli w JAK-005, nadając kolejny numer i datę.
3. Dopisz w Sprawozdaniu różnice względem poprzedniego wiersza: co wzrosło,
   co spadło, które progi z JAK-004 zostały przekroczone i dlaczego.
4. Pełny raport zostaje w `client/reports/metrics.md` (katalog ignorowany przez
   git), a log w `${TMPDIR:-/tmp}/opencode/mvaw`.
5. Mierz po refaktorze, po dodaniu testów i po zmianie zależności runtime —
   zawsze tą samą komendą i na tej samej maszynie.

Pomiar nie jest częścią CI: `make metrics` uruchamia się ręcznie, a pipeline
pozostaje przy typach, testach i mutacjach. Zmiana celów `Makefile` albo CI
wymaga aktualizacji [[Infrastruktura]] w tym samym commicie.

## JAK-008: Ograniczenia

- **TypeScript 7 bez API JS.** Kompilator natywny nie udostępnia API, na którym
  opierają się Stryker (obejście: nieistniejący `tsconfig`), `ts-prune`,
  dependency-cruiser i typescript-eslint. Działa `tsc` (CLI), Vitest, Biome
  i narzędzia czytające pliki bez parsera TS.
- **Phaser w `scenes/` i `view/`.** Testy jednostkowe tych warstw są drogie;
  próg pokrycia dotyczy `core/`, więc wysoki wynik nie oznacza, że cała gra jest
  pokryta.
- **Brak klas w TypeScript.** Metryka LCOM4 (liczba spójnych odpowiedzialności)
  nie ma praktycznego odpowiednika; „odpowiedzialności” przybliżamy liczbą
  linii i eksportów na plik.
- **MSI backendu** pojawi się tylko wtedy, gdy istnieje raport Infection
  (`server/var/infection/`); bez niego kolumna ma `—`.
- **Czasy** zależą od cache, obciążenia maszyny i wersji Node — porównuj serie,
  nie pojedyncze pomiary.
- **Bundle** liczony jest z `client/dist` po buildzie, tylko pliki `.js`, bez
  gzip; nie obejmuje assetów graficznych i dźwiękowych.
