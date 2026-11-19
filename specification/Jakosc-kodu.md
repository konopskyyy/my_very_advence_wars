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
| Pokrycie | `@vitest/coverage-v8` (próg 80% linii `core/`) | `client/src/core` | `make coverage` | ✅ |
| Lint / złożoność | Biome 2 (`noExcessiveCognitiveComplexity`, `useMaxParams`, `noExcessiveLinesPerFunction`) | `client/src`, `tests` | `make lint-client` | ✅ |
| Cykle i sieroty | dependency-cruiser 17.4.3 | `client/src` | `make quality-client` | ❌ |
| Martwe eksporty | Knip 6 | `client/src`, `tests` | `make quality-client` | ✅ |
| Duplikaty | jscpd (`threshold: 5`) | `client/src`, `tests` | `make quality-client` | ❌ |
| Złożoność backendu | PHPMD 3 (`codesize`, `design`; CBO ≤ 14) | `server/src` | `make lint-server` | ✅ |
| Agregaty backendu | PhpMetrics 2.11 (MI, Halstead, LOC, CBO) | `server/src` | `make metrics` | ❌ |
| Agregaty klienta | code-multivitals 1.6 (MI, Health Score, CC, Halstead) | `client/src` | `make metrics` | ❌ |
| Czasy i bundle | `scripts/check-bundle-size.mjs` (1600 KiB) | `server/public/game` | `make bundle-check` | ❌ |
| Typy backendu | Psalm (poziom 3, `findUnusedCode`, baseline 46) | `server/src`, `tests` | `make lint-server` | ✅ |
| Styl backendu | php-cs-fixer (`@Symfony`) | `server/src`, `tests`, `config` | `make lint-server` | ✅ |
| Audyt zależności | Composer (`validate --strict`, `audit`) | `server/` | `make audit-server` | ✅ |
| Nieużywane zależności | composer-unused | `server/` | `make unused-server` | ✅ (okresowo) |
| Mutacje backendu | Infection (`minMsi 80`, `minCoveredMsi 90`) | `server/src` | `vendor/bin/infection` | ✅ |
| Metryki na żądanie | `scripts/metrics.sh` | klient + raporty | `make metrics` | ❌ (celowo) |

**Sprawozdanie**

- Klient ma solidne fundamenty: strict TypeScript, Vitest, pokrycie linii
  `core/` na poziomie 90,9% i mutacje na `core/`. Progi Strykera podniesiono do
  `break 70`, `high 85`, więc wynik 80,4% ma już tylko 10 punktów zapasu.
- Po wdrożeniu `INFRA-009`, `INFRA-010`, `INFRA-013` i `INFRA-016`
  z punktu wyjściowego zostaje jedna luka: **dependency-cruiser** (TS 7).
  Reszta — pokrycie, lint, martwe eksporty, rozmiar, czasy, bundle, Psalm
  i styl — ma cel w `Makefile` i/lub krok w CI.
- `make quality-client` nadal obejmuje `dependency-cruiser`, dlatego jego wynik
  należy czytać ostrożnie: „0 naruszeń” oznacza brak danych, nie brak problemów.
  Knip działa z TypeScript 7 i zastąpił `ts-prune`.
- **dependency-cruiser z TypeScript 7 zwraca 0 modułów** (`0 modules,
  0 dependencies cruised`), mimo że pliki istnieją. TypeScript 7 (kompilator
  natywny) nie udostępnia API JS, na którym opiera się parser narzędzia — ten
  sam problem obejliśmy w Strykerze nieistniejącym `tsconfig`.
- Psalm (poziom 3, `findUnusedCode`) i php-cs-fixer (`@Symfony`) mają cel
  `make lint-server` i job `server-quality`; phpcs został usunięty, żeby nie
  dublował standardu stylu. 46 zgłoszeń martwego kodu (głównie serwisy Symfony
  i klasy testów, których Psalm nie widzi przez kontener) jest w baseline
  z zadaniem `INFRA-019` na spłatę.

## JAK-003: Porównanie narzędzi

| Narzędzie | Co mierzy | Koszt wdrożenia | Ryzyko | Decyzja |
| --- | --- | --- | --- | --- |
| `@vitest/coverage-v8` | pokrycie linii/gałęzi | `npm i` + skrypt + próg | niskie (V8, bez API TS) | **must-have** |
| Biome (`noExcessiveCognitiveComplexity`, `useMaxParams`, `noExcessiveLinesPerFunction`) | złożoność poznawcza, parametry i długość funkcji, nieużywane importy | `npm i` + config; formatter osobno | niskie (parser Rust) | **must-have** (tylko lint) |
| `scripts/metrics.sh` + `make metrics` | czasy, bundle, linie, eksporty, MSI | brak zależności | niskie | **wdrożone** |
| Psalm + phpcs | typy i styl backendu | 0 (już w repo), tylko cel `make` | niskie | **must-have** |
| PHPMD 3 (`codesize`, `design`) | złożoność cyklomatyczna, NPath, długość metod, liczba parametrów, coupling | `composer require --dev` + ruleset | średnie (cache PDepend, próg CBO) | **wdrożone** (`INFRA-020`) |
| PhpMetrics 2.11 | utrzymywalność (MI), Halstead, LOC i coupling na klasę, raport JSON | `composer require --dev` + `composer metrics` | niskie (pomiar na żądanie, bez progów) | **wdrożone** (`INFRA-021`) |
| code-multivitals 1.6 | MI (0–100), Health Score, złożoność cyklomatyczna/kognitywna, Halstead, klony | `make client-install` + `npm run metrics` | niskie (izolowany TS 6, pomiar na żądanie bez bramki) | **wdrożone** (`INFRA-022`) |
| Stryker | mutacje `core/` | jest; podniesienie progu | niskie | **podnieść próg** |
| jscpd | duplikaty | jest; `threshold` 30 → 5 | niskie | **zaostrzyć** |
| dependency-cruiser | cykle, sieroty, fan-in/fan-out | jest, ale nie działa z TS 7 | wysokie (0 modułów) | **naprawić lub wyłączyć** |
| ESLint + typescript-eslint | lint, complexity | wysoki | wysokie (brak API TS 7) | **odrzucone do czasu wsparcia** |
| `ts-prune` | martwe eksporty | jest, ale zależny od API TS | średnie | **zastąpiony przez Knip** (`INFRA-016`) |
| Knip | martwe eksporty i zależności | `npm i` | niskie (działa z TS 7) | **wdrożone** (`INFRA-016`) |
| `rollup-plugin-visualizer` / `size-limit` | budżet bundla | `npm i` + config | niskie | opcjonalne |
| Rector | mechaniczne migracje PHP i Symfony | `composer require --dev` | średnie (brak zgodnego `rector/rector-symfony`) | **wdrożone dla PHP 8.4** (`INFRA-018`) |
| `composer-unused` (`icanhazstring/composer-unused`) | nieużywane zależności Composera | `composer require --dev` | niskie | **wdrożone** (`INFRA-017`, przegląd okresowy) |
| `hyperfine` / `scc` / `tokei` | benchmarki i linie | binarka poza npm | niskie | odrzucone (skrypt wystarcza) |
| PHPStan | typy backendu | duplikat Psalma | średnie | odrzucone |
| SonarQube / CodeClimate | platforma metryk | wysoki (serwer/konto) | wysokie | odrzucone |

**Sprawozdanie**

- **Must-have** to narzędzia, które dają nowy sygnał niskim kosztem: pokrycie
  (V8 nie dotyka API TypeScriptu), Biome (własny parser, więc działa z TS 7)
  oraz uruchomienie Psalma i php-cs-fixera, które już leżą w repo. Do tego zaostrzenie
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
| Parametry funkcji | 6 | Biome (`useMaxParams`) |
| Długość funkcji (TS, `src/`) | 100 linii | Biome (`noExcessiveLinesPerFunction`) |
| Złożoność cyklomatyczna metody (PHP) | 10 | PHPMD (`codesize`) |
| NPath metody (PHP) | 200 | PHPMD (`codesize`) |
| Długość metody (PHP) | 100 linii | PHPMD (`codesize`) |
| Liczba parametrów metody (PHP) | 10 | PHPMD (`codesize`) |
| CouplingBetweenObjects | 14 | PHPMD (`design`) |
| Pokrycie linii `core/` | ≥ 80% | `npm run coverage` (próg w Vitest) |
| MSI klient | `break 70`, `high 85` | Stryker (CI) |
| MSI serwer | `minMsi 80`, `minCoveredMsi 90` | Infection (CI) |
| MI backendu | brak progu (obserwacja) | `make metrics` (PhpMetrics) |
| MI klienta | brak progu (obserwacja) | `make metrics` (code-multivitals) |
| Duplikaty | ≤ 5% | jscpd (`threshold: 5`) |
| Bundle JS | ≤ 1600 KiB | `make bundle-check` (ręcznie po buildzie) |
| Naruszenia zależności | 0 | dependency-cruiser po naprawie TS 7 |
| Typy i styl backendu | 0 błędów | Psalm poziom 3 + php-cs-fixer (`make lint-server`) |
| Build klienta | ≤ 10 s | `make metrics` (miękki) |
| Typy klienta | ≤ 3 s | `make metrics` (miękki) |
| Testy klienta | ≤ 10 s | `make metrics` (miękki) |

**Sprawozdanie**

- Progi rozmiaru wynikają z obecnego stanu (2026-11-18): 4 pliki przekraczają
  500 linii (`ScenarioScene.ts` 2355, `recruitDialog.ts` 943, `planTimeline.ts`
  718, `unitLayer.ts` 521), więc twardy próg 500 dotyczy tylko nowych plików,
  a istniejące dostają zadanie rozbicia. `scenarioCommandBar.ts` spadł do 444
  i jest wzorem, że rozbicie da się przeprowadzić. Limit eksportów 12 bierze się
  z `core/tutorial.ts` i `storage/replays.ts` (po 19); `core/map/model.ts` ma 16.
- Próg pokrycia dotyczy wyłącznie `core/` — `scenes/` i `view/` są zależne od
  Phasera i testowanie ich jednostkowo kosztowałoby więcej niż daje.
- MSI klienta podnosimy dopiero po ustabilizowaniu zestawu testów: `break 70`
  jest bezpieczne przy 80,4%, a `high 85` wyznacza kierunek. Nie podnosimy
  od razu do 80, bo pojedynczy timeout mutanta nie powinien blokować commita.
- Progi czasu są miękkie — służą do wykrywania skoków (np. po dodaniu ciężkiej
  zależności), nie do blokowania pracy.
- **Parametry i długość funkcji w TS** uzupełniają złożoność poznawczą: limit 6
  parametrów przepuszcza istniejące API, a 100 linii dotyczy tylko `src/`, bo
  bloki `describe` w testach naturalnie przekraczają ten rozmiar. Funkcje ponad
  limit w istniejących plikach są w override z zadaniem rozbicia (`INFRA-020`).
- **PHPMD** bierze progi domyślne `codesize` (10/200/100/10) i `design`; jedyne
  odstępstwo to coupling 14 zamiast 13, bo weryfikator Google po rozbiciu na
  `GoogleJwksProvider` nadal orkiestruje JWT i claims. Typy i martwy kod
  zostają w Psalmie, żeby narzędzia się nie dublowały.

## JAK-005: Pomiary

| # | Data | Commit | Typy (s) | Testy (s) | Build (s) | Bundle JS (KiB) | Pokrycie core (%) | MSI klient (%) | MSI serwer (%) | MI klienta | MI backendu | Max plik (linie) | Eksporty (max) | Duplikaty (%) | Naruszenia depcruise |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 2026-11-10 | 8cc0055 | 0,8 | 1,8 | 1,6 | 1479,5 | — | 80,4 | — | — | — | 662 | 16 | 2,8 | — |
| 1 | 2026-11-18 | ea3cbf8 | 4,0 | 2,9 | 1,8 | 1598,4 | — | 80,4 | — | — | — | 2355 | 19 | 3,7 | — |
| 2 | 2026-11-18 | 5294155 | 2,8 | 2,9 | 1,7 | 1598,4 | 90,9 | 73,9 | — | — | — | 2355 | 19 | 3,7 | — |
| 3 | 2026-11-19 | 3f836b3 | 3,0 | 2,7 | 1,7 | 1598,5 | 90,9 | 73,9 | — | 49,6 | 90,4 | 2355 | 19 | 3,7 | — |

Pomiar #3 jest pierwszym z kolumnami `MI klienta` i `MI backendu`; wnioski
są w uzupełnieniu do pomiaru #2 poniżej.

**Sprawozdanie #0 (2026-11-10)**

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

**Porównanie #0 → #1 (2026-11-18)**

| Metryka | #0 (2026-11-10) | #1 (2026-11-18) | Zmiana | Ocena |
| --- | --- | --- | --- | --- |
| Typy (s) | 0,8 | 4,0 | +3,2 s (5×) | **gorzej** — przekroczony miękki próg 3 s |
| Testy (s) | 1,8 | 2,9 | +1,1 s | **gorzej** — nadal w progu 10 s |
| Build (s) | 1,6 | 1,8 | +0,2 s | **gorzej** — nadal w progu 10 s |
| Bundle JS (KiB) | 1479,5 | 1598,4 | +118,9 KiB (+8,0%) | **gorzej** — 1,6 KiB od progu 1600 |
| Pokrycie core (%) | — | — | bez zmian | **bez danych** — brak `@vitest/coverage-v8` |
| MSI klient (%) | 80,4 | 80,4 | bez zmian | **bez zmian** — raport Strykera nieodświeżony |
| MSI serwer (%) | — | — | bez zmian | **bez danych** — brak raportu Infection |
| Max plik (linie) | 662 | 2355 | +1693 (+256%) | **gorzej** — 4,7× twardego progu 500 |
| Eksporty (max) | 16 | 19 | +3 | **gorzej** — ponad próg 12 |
| Duplikaty (%) | 2,8 | 3,7 | +0,9 p.p. | **gorzej** — poniżej progu 5%, ale jscpd nadal 30 |
| Naruszenia depcruise | — | — | bez zmian | **bez danych** — TS 7, 0 przeanalizowanych modułów |

**Opinia po pomiarze #1 (2026-11-18, przed narzędziami)**

- **Ogólna ocena: regresja.** W osiem dni doszło 11,8 tys. linii w `client/src`
  (102 pliki), ale największa pojedyncza zmiana trafiła do jednego pliku:
  `ScenarioScene.ts` urósł z 589 do 2355 linii (+2020 w
  `git diff 8cc0055..HEAD`), czyli jest już **4,7× powyżej twardego progu**.
  To nie jest „duży plik do rozbicia”, a scena, która przejęła odpowiedzialność
  za HUD, kampanię, input i przebieg misji — dokładnie ten przypadek, przed
  którym broni limit 500.
- **Refaktor `recruitDialog.ts` nie nastąpił** — plik wzrósł z 662 do 943 linii
  (+42%). Za to `scenarioCommandBar.ts` zmalał z 518 do 444 i spadł poniżej
  progu, co pokazuje, że rozbijanie działa; problemem jest brak konsekwencji,
  nie brak możliwości.
- **Bundle ociera się o budżet.** 1598,4 KiB przy progu 1600 KiB oznacza, że
  kolejna zależność runtime (albo większy asset w bundlu) przekroczy limit.
  Wzrost o 118,9 KiB w tydzień to sygnał, żeby przed dodaniem pakietu sprawdzić
  `make metrics`, a nie po.
- **Czasy pogorszyły się, ale ostrożnie z wnioskami.** Typy 4,0 s przekraczają
  miękki próg 3 s, jednak pojedynczy pomiar zależy od cache i obciążenia
  maszyny (przy #0 zimny test trwał 5,0 s). Trend warto potwierdzić kolejnym
  pomiarem; jeśli się utrzyma, winna jest rosnąca liczba plików, nie Phaser.
- **Progi z JAK-004 nadal nie działają.** jscpd ma `threshold: 30` zamiast 5,
  Stryker `break 50`/`high 80` zamiast 70/85, a pokrycia i Biome nie ma w
  `package.json`. Duplikaty 3,7% i MSI 80,4% mieszczą się w limitach tylko
  dlatego, że limity są za niskie — nie dlatego, że jakość jest dobra.
- **Co dalej, w kolejności zysku:** (1) rozbić `ScenarioScene.ts` na moduły
  `view/` zanim urośnie bardziej, (2) dodać `@vitest/coverage-v8` i pokrycie
  `core/`, (3) zaostrzyć jscpd i Stryker do wartości z JAK-004, (4) dopiero
  potem wracać do `recruitDialog.ts` i `planTimeline.ts`.

**Sprawozdanie #2 (2026-11-18, po wdrożeniu narzędzi)**

- **Pokrycie core 90,9%** to pierwszy realny pomiar (`@vitest/coverage-v8`
  z INFRA-009), a nie szacunek. Próg 80% jest spełniony z zapasem; `scenes/`
  i `view/` pozostają poza pomiarem, bo zależą od Phasera.
- **MSI klienta 73,9%** pochodzi ze świeżego przebiegu Strykera
  (`make metrics-mutation`), a nie z raportu sprzed tygodni. Spadek względem
  80,4% nie oznacza pogorszenia kodu — poprzednia liczba dotyczyła innego,
  starszego zestawu testów. Próg `break 70` przechodzi, do `high 85` brakuje
  11,1 p.p.
- **Knip: 0 zgłoszeń, Biome: 0 błędów i 0 ostrzeżeń** na 186 plikach. Martwy
  kod i lint nie blokują pracy, ale też nie mają czego ucinać — to stan
  wyjściowy przed dalszym rozwojem.
- **Backend:** Psalm poziom 3 z `findUnusedCode` nie zgłasza błędów poza
  baseline (46 wpisów), wnioskuje typy dla 97,8% kodu i proponuje 17
  automatycznych poprawek; php-cs-fixer nie znajduje nic do zmiany w 60
  plikach. `composer validate --strict` przechodzi, audyt nie wykazuje
  podatności, `composer-unused` widzi 13 użytych i 0 nieużywanych pakietów.
  Pozostaje jeden porzucony pakiet (`doctrine/common`, bez zamiennika).
- **Rector (dry-run):** 8 plików do zmiany pod PHP 8.4, głównie promocja
  właściwości do konstruktora i first-class callables. Reguły Symfony 8.1
  czekają na pakiet zgodny z Rector 2.x (INFRA-018).
- **Czasy i rozmiar bez niespodzianek:** typy 2,8 s wracają w próg 3 s
  (poprzednie 4,0 s było pomiarem z zimnym cache), testy 2,9 s, build 1,7 s.
  Bundle 1598,4 KiB nadal 1,6 KiB pod budżetem, duplikaty 3,7% przy progu 5%.
  `ScenarioScene.ts` (2355 linii) i 19 eksportów w `core/tutorial.ts` oraz
  `storage/replays.ts` pozostają największym długiem rozmiaru.
- **dependency-cruiser nadal analizuje 0 modułów** (TS 7) — brak danych
  o naruszeniach, nie ich brak. Pokrycie serwera nie pojawia się w tabeli,
  bo Infection uruchamia się tylko w CI i nie zostawia artefaktu lokalnie.

**Porównanie #1 → #2 (2026-11-18)**

| Metryka | #1 | #2 | Zmiana | Ocena |
| --- | --- | --- | --- | --- |
| Typy (s) | 4,0 | 2,8 | −1,2 s | **lepiej** — w progu 3 s |
| Testy (s) | 2,9 | 2,9 | bez zmian | w progu 10 s |
| Build (s) | 1,8 | 1,7 | −0,1 s | w progu 10 s |
| Bundle JS (KiB) | 1598,4 | 1598,4 | bez zmian | 1,6 KiB pod progiem |
| Pokrycie core (%) | — | 90,9 | pierwszy pomiar | **dobrze** — próg 80 z zapasem |
| MSI klient (%) | 80,4 | 73,9 | −6,5 p.p. | **rzetelniejszy pomiar** — świeży przebieg zamiast starego raportu |
| Max plik (linie) | 2355 | 2355 | bez zmian | **gorzej** — 4,7× twardego progu |
| Eksporty (max) | 19 | 19 | bez zmian | **gorzej** — ponad próg 12 |
| Duplikaty (%) | 3,7 | 3,7 | bez zmian | poniżej progu 5% |

**Opinia po pomiarze #2 (2026-11-18)**

- **Narzędzia działają, więc liczby wreszcie coś znaczą.** Pokrycie, świeży
  MSI, Knip i Biome mierzą to, co miały mierzyć; progi z JAK-004 są
  egzekwowane w CI, a nie tylko zapisane. To jakościowa zmiana względem
  pomiaru #1, w którym większość kolumn miała `—`.
- **Problemem przestała być infrastruktura, a został rozmiar.** Jedyny
  czerwony wskaźnik to `ScenarioScene.ts` — 2355 linii i 4,7× twardego progu.
  Reszta metryk jest w limitach, więc kolejny krok to rozbicie sceny, nie
  dokładanie narzędzi.
- **73,9% MSI to punkt wyjścia, nie wynik.** Próg `break 70` daje zbyt mały
  margines, żeby podnosić go teraz, ale spadek względem 80,4% pokazuje, że
  stary raport zawyżał obraz. Do decyzji o `high` potrzebny jest drugi świeży
  przebieg po rozbiciu sceny.
- **Budżet bundla jest realnym ograniczeniem.** 1598,4 KiB przy limicie
  1600 KiB oznacza, że kolejny pakiet runtime wejdzie tylko po usunięciu
  czegoś innego. To sygnał do sprawdzania `make bundle-check` w przeglądzie,
  zanim zależność trafi do `package.json`.
- **Baseline i porzucony pakiet to jawny dług, nie wyciszenie.** 46 wpisów
  Psalma i `doctrine/common` są widoczne w `make lint-server` oraz
  `make audit-server`, a ich spłatę śledzi INFRA-019.
- **Po pomiarze doszły reguły z rodziny mess detectora** (`INFRA-020`): PHPMD
  w backendzie i `useMaxParams`/`noExcessiveLinesPerFunction` w Biome. Backend
  przeszedł bez baseline po rozbiciu `GoogleIdTokenVerifier` na parser,
  weryfikator i `GoogleJwksProvider`; klient nie ma nowych naruszeń poza
  funkcjami już objętymi override.

**Uzupełnienie do pomiaru #2 (2026-11-19, INFRA-021)**

- **Backend ma pierwszy agregat jakości: MI 90,4** jako średnia z 45 klas
  w `server/src` (skala PhpMetrics nie jest ograniczona do 100). Najniższy MI
  ma `RefreshTokenManager` (44,4), dalej `GoogleLoginHandler` (51,2) i
  `GoogleIdTokenVerifier` (56,8). Ostatni z nich nadal ma najwyższą złożoność
  klasową (18), ale maksymalna złożoność jego metod to 8 — po rozbiciu
  z INFRA-020 nie przekracza progu PHPMD.
- **PhpMetrics widzi inne naruszenia niż PHPMD.** Raport pokazuje 0 critical,
  2 error i 8 warning: `User` jako Blob/God object (8 metod publicznych,
  LCOM=3) oraz `GoogleJwksProvider` z maksymalną złożonością metody 11,
  a także 8 reguł stabilności pakietów (5 SAP, 3 SDP). PHPMD przechodzi bez
  baseline, więc to uzupełnienie obrazu, nie sprzeczność — oba narzędzia
  liczą złożoność inaczej i PhpMetrics nie ma progów w CI.
- **Powtórka z 19.11 nie zmienia wniosków z #2:** bundle 1598,5 KiB (1,5 KiB
  pod limitem), duplikaty 3,7%, pokrycie 90,9%, MSI 73,9%. Różnice w czasach
  to szum pomiarowy; jedyną nową kolumną w tabeli jest MI backendu.
- **Pierwszy strukturalny pomiar `view/` i `scenes/`: MI klienta 49,6** w skali
  0–100 oraz Health Score 67,7 na 141 plikach i 1186 funkcjach. To warstwy
  wyłączone z pokrycia, więc wcześniej nie było o nich danych. Skali tego MI
  nie wolno porównywać z MI 90,4 z PhpMetrics — każde narzędzie liczy je inaczej.
- **Nowe hotspoty są w `view/`, nie tylko w `ScenarioScene.ts`.** Najgorszy MI
  ma `recruitDialog.ts:constructor` (17,1; 345 linii), potem
  `accountOverlay.ts:createOverlay` (23,3; CC 25) i
  `authScreen.ts:mountAuthScreen` (24,4; CC 33). code-multivitals zgłasza
  przy profilu `default` 64 błędy i 364 ostrzeżenia oraz 60 par klonów;
  to liczby obserwacyjne, nie bramka CI — analogicznie jak przy PHPMD nie
  zmieniamy progów Biome.

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
2. Po buildzie klienta uruchom `make bundle-check`, żeby sprawdzić próg
   1600 KiB i odnotować zapas w Sprawozdaniu.
3. Skopiuj wiersz z końcówki do tabeli w JAK-005, nadając kolejny numer i datę.
4. Dopisz w Sprawozdaniu różnice względem poprzedniego wiersza: co wzrosło,
   co spadło, które progi z JAK-004 zostały przekroczone i dlaczego.
5. Pełny raport zostaje w `client/reports/metrics.md` (katalog ignorowany przez
   git), a log w `${TMPDIR:-/tmp}/opencode/mvaw`.
6. Mierz po refaktorze, po dodaniu testów i po zmianie zależności runtime —
   zawsze tą samą komendą i na tej samej maszynie.

Pomiar nie jest częścią CI: `make metrics` i `make bundle-check` uruchamiają się
ręcznie, a pipeline pozostaje przy typach, testach i mutacjach. Zmiana celów `Makefile` albo CI
wymaga aktualizacji [[Infrastruktura]] w tym samym commicie.

## JAK-008: Ograniczenia

- **TypeScript 7 bez API JS.** Kompilator natywny nie udostępnia API, na którym
  opierają się Stryker (obejście: nieistniejący `tsconfig`) oraz
  dependency-cruiser i typescript-eslint. Działa `tsc` (CLI), Vitest, Biome,
  Knip i narzędzia czytające pliki bez parsera TS.
- **Rector bez reguł Symfony.** Rector 2.8 obsługuje poziom PHP 8.4, ale
  `rector/rector-symfony` jest zgodny tylko z Rector 1.x. Reguły Symfony 8.1
  dołączymy, gdy pakiet wspólnie z Rector 2.x będzie instalowalny.
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
- **Bundle** liczony jest z `server/public/game` po buildzie, tylko pliki `.js`, bez
  gzip; nie obejmuje assetów graficznych i dźwiękowych.
