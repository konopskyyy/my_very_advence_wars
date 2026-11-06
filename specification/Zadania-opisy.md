# Zadania — opisy

Zadania spoza tej listy się nie robi — nową pracę dopisuj do tabeli poniżej
(zasady w `AGENTS.md`). Tutaj jest **tylko pełny opis**: kontekst, zakres
i kryteria. Status i powiązania są wyłącznie w [[Zadania]].

## GRA-001: Edytor mapy
- **Kontekst:** Gra potrzebuje sposobu tworzenia niestandardowych map bez ręcznego pisania JSON-a. Użytkownik chce malować teren na siatce heksagonalnej i móc zapisać mapę do dalszego użytku.
- **Opis:** Edytor map na siatce heksagonalnej. Malowanie terenu i rozstawianie jednostek, budowa zbioru kafelków poza pierwotnym prostokątem, zoom, przewijanie, zapisywanie szkicu. Proporcje 16:9 i skalowanie przez Phaser `Scale.FIT`.
- **Kryteria:** `master` wskazuje on `8600483`; `npm test` in `client/` passes; editor starts from main menu („Edytor map”), `ESC` returns to menu; map is a collection of tiles with absolute coordinates — tiles can be painted outside the original rectangle.

## GRA-002: Model jednostek
- **Kontekst:** Potrzebny jest spójny model jednostek dla edytora i rozgrywki. Musi być wystarczający do rozstawiania w edytorze i do przyszłej logiki bitewnej.
- **Opis:** Modele jednostek piechoty, czołgu, artylerii, zwiadu dla obu stron. Właściwości, identyfikatory, pozycjonowanie na heksach. Logika gry nie wiąże się z Phasera (ADR-001).
- **Kryteria:** Istnieje moduł `client/src/core/units/` z modellem wspólnym (`types.ts`, `model.ts`, `faction.ts`) i osobnym plikiem na każdy rodzaj jednostki; jednostki można stawiać w edytorze map (GRA-012), typy pokrywają się ze specyfikacją.

## GRA-003: Zapis i wczytywanie map
- **Kontekst:** Edytor produkuje mapy, które trzeba przechowywać między sesjami. Potrzebny format zapisu obejmujący teren i jednostki.
- **Opis:** Zapis i odczyt mapy (teren, jednostki, metadane). Docelowo integracja z SQLite (GRA-021). Format JSON spójny z modelem.
- **Kryteria:** Mapy są zapisywane/wczytywane, struktura zgodna z `specification/Mapy.md`.

## GRA-004: Podstawa budowy mapek
- **Kontekst:** Potrzebna gotowa podstawa pod generowanie map do testów i scenariuszy.
- **Opis:** Podstawowe narzędzia do budowy mapek, wspierające pracę edytora i generatora.
- **Kryteria:** Używane przez GRA-001, GRA-006.

## GRA-005: Punkt bazowy — stan po ostatnim commicie
- **Kontekst:** Ustalony punkt odniesienia dla dalszych prac.
- **Opis:** Stan repozytorium po ostatnim commicie jako punkt bazowy.
- **Kryteria:** Repo w stabilnym stanie, testy klienta przechodzą.

## GRA-006: Rozbudowa generatora map
- **Kontekst:** Potrzebne procedury generowania map na potrzeby testowania i scenariuszy.
- **Opis:** Rozszerzony generator map wspierający edytor i nowe funkcje.
- **Kryteria:** Generator używany w GRA-017, wspiera seedowane mapy.

## GRA-007: Moduł mapy i algorytm układu heks
- **Kontekst:** Matematika heksagonalnej siatki musi być w jednym miejscu zgodnym z ADR-001.
- **Opis:** Moduł `core/map/` z układem heks, konwersjami, sąsiedztwem. Offset w modelu, podwójna kolumna w HUD zgodnie z ADR-004.
- **Kryteria:** Wspólny moduł używany przez edytor i scenę gry.

## GRA-008: Narzędzia deweloperskie i dev bar mapy
- **Kontekst:** Potrzebny podgląd wydajności i stanu mapy podczas rozwoju.
- **Opis:** Dev bar, narzędzia diagnostyczne; tymczasowo zawsze widoczne (GRA-018).
- **Kryteria:** Dev bar pokazuje FPS, czas, liczbę kafli, CPU, rozmiar modelu.

## GRA-009: Menu bez pola bitwy, z wyjściem z gry
- **Kontekst:** Wejście do gry musi prowadzić przez menu, bez zastępczej sceny pola bitwy.
- **Opis:** Menu główne z opcjami „Scenariusze”, „Edytor map”, „Wyjście”. Usunięta scena zastępcza.
- **Kryteria:** Zgodne z INTERF-001.

## GRA-010: Strona gry bez paska przewijania
- **Kontekst:** Gra ma wypełniać ekran bez pasków przeglądarki.
- **Opis:** Konfiguracja CSS/scale uniemożliwiająca pojawienie się paska przewijania.
- **Kryteria:** Brak paska przewijania na stronie gry.

## GRA-011: Podwojone kolumny w odczycie edytora
- **Kontekst:** Współrzędne dla gracza mają być czytelne.
- **Opis:** Wyświetlanie współrzędnych heksu jako kolumna podwojona zgodnie z ADR-004.
- **Kryteria:** HUD pokazuje `kolumna, wiersz` w podwójnych kolumnach.

## GRA-012: Jednostki w edytorze map
- **Kontekst:** Edytor musi umożliwiać rozstawianie jednostek.
- **Opis:** Tryb jednostek, wybór rodzaju i strony, stawianie/usuwanie.
- **Kryteria:** Zgodne z INTERF-003.

## GRA-013: Testy klienta w lustrzanym drzewie
- **Kontekst:** Testy mają odzwierciedlać strukturę `src/`.
- **Opis:** Testy w `client/tests/` lustrzanie do `client/src/`, bez `*.test.ts` w `src/` (ADR-008).
- **Kryteria:** `npm test` przechodzi, struktura zgodna.

## GRA-014: CI typów TypeScript
- **Kontekst:** Chcemy wczesnego łapania błędów typów.
- **Opis:** GitHub Actions sprawdza `tsc --noEmit` w `client/` (ADR-009).
- **Kryteria:** Pipeline działa przy push/PR na `master`.

## GRA-015: Rzeczownikowy opis commitów
- **Kontekst:** Spójny styl historii.
- **Opis:** Commity po polsku, styl conventional, opis rzeczownikowo (ADR-010).
- **Kryteria:** Zasady w `AGENTS.md`.

## GRA-016: Menu wyboru terenu i jednostek
- **Kontekst:** Szybszy wybór narzędzi w edytorze.
- **Opis:** Panel budowy w edytorze z kafelkami terenu i jednostek.
- **Kryteria:** Zgodne z INTERF-003.

## GRA-017: Wybór mapy przy wejściu do edytora
- **Kontekst:** Użytkownik musi móc wybrać istniejącą mapę do edycji.
- **Opis:** Menu map jako wejście do edytora, opcja „Nowa mapa”.
- **Kryteria:** Zgodne z INTERF-004.

## GRA-018: Tymczasowo zawsze widoczny pasek dev
- **Kontekst:** Ułatwienie diagnostyki podczas prac.
- **Opis:** Dev bar zawsze widoczny (ADR-014).
- **Kryteria:** Widoczny w edytorze.

## GRA-019: Pełny ekran 16:9
- **Kontekst:** Gra ma zajmować cały ekran w proporcjach 16:9.
- **Opis:** Układ 16:9 skalowany przez `Scale.FIT`.
- **Kryteria:** Zgodne z INTERF-003.

## GRA-020: Menu scenariuszy i duża mapa testowa
- **Kontekst:** Potrzebne wejście do rozgrywki.
- **Opis:** Menu scenariuszy, duży scenariusz testowy.
- **Kryteria:** Zgodne z INTERF-005.

## GRA-021: Zapis map w wewnętrznym SQLite
- **Kontekst:** Trwały zapis map bez backendu.
- **Opis:** SQLite w WebAssembly (`sql.js`), baza w `localStorage`, tabela `maps` (ADR-017).
- **Kryteria:** Zapis/odczyt działa, seed map startowych.

## GRA-022: Wspólny moduł widoku mapy
- **Kontekst:** Unikanie duplikacji między edytorem a sceną gry.
- **Opis:** Wspólne moduły `view/mapViewport.ts`, `view/scrollList.ts`, `view/mapCard.ts` (ADR-018).
- **Kryteria:** Edytor i scena korzystają ze wspólnego widoku.

## GRA-023: Przewijane listy map i scenariuszy
- **Kontekst:** Długie listy nie mieszczą się na ekranie.
- **Opis:** Przewijanie kółkiem, pasek pozycji (ADR-018).
- **Kryteria:** Zgodne z INTERF-004, INTERF-005.

## GRA-024: Przewijanie kamery krawędzią ekranu
- **Kontekst:** Ułatwienie nawigacji po dużej mapie.
- **Opis:** Automatyczne przewijanie przy zbliżeniu kursora do krawędzi.
- **Kryteria:** Działa w edytorze i scenariuszu.

## GRA-025: Zapisana wersja mapy wbudowanej w menu map
- **Kontekst:** Mapy wbudowane muszą być dostępne jako wpisy w SQLite.
- **Opis:** Seed map wbudowanych do bazy.
- **Kryteria:** Widoczne w menu map i edytorze.

## GRA-026: Wersjonowane migracje SQLite
- **Kontekst:** Schemat bazy będzie ewoluował.
- **Opis:** System migracji wersjonowanych dla SQLite.
- **Kryteria:** Migracje działają, testy pokrywają przypadki.

## GRA-027: Grywalny scenariusz — tury, armie, ruch i stały interfejs
- **Kontekst:** Pierwsza grywalna wersja scenariusza.
- **Opis:** Naprzemienne tury (ADR-020), uzupełnianie armii (ADR-021), ruch jednostek, stały interfejs z dwiema kamerami (ADR-023, ADR-024).
- **Kryteria:** Hot-seat, przycisk końca tury, pasek dowodzenia, logika w `core/`.

## GRA-028: Nazwa mapy w edytorze
- **Kontekst:** Użytkownik chce nadawać nazwy mapom w edytorze.
- **Opis:** Edycja nazwy w kanwie (ADR-025).
- **Kryteria:** Nazwa zapisywana w SQLite, widoczna w menu.

## GRA-029: Menu scenariuszy z podglądem i edycją mapy
- **Kontekst:** Scenariusz = mapa z SQLite.
- **Opis:** Każda mapa potencjalnym scenariuszem, edycja mapy z menu scenariuszy (ADR-026).
- **Kryteria:** Zgodne z INTERF-005.

## GRA-030: Pełny ruch jednostek z trasą i animacją
- **Kontekst:** Ruch o jedno pole (GRA-027, ADR-022) nie wykorzystywał `moveRange` ani kosztu terenu, a gracz nie widział trasy przed wykonaniem ruchu. Potrzebny był ruch po ścieżce z podglądem kosztu i potwierdzeniem.
- **Opis:** Pathfinding po heksach z kosztem terenu (`getMovePath()`), pierwszy klik rysuje najtańszą trasę w budżecie `movesLeft`, drugi klik na jej końcu potwierdza ruch (ADR-027). Jednostka zużywa punkty ruchu za całą trasę, a `hasActed` dostaje dopiero przy zerowym ruchu. Token animuje się po kolejnych polach trasy, a dolny pasek pokazuje aktualne `movesLeft/moveRange` i koszt ruchu terenu pod kursorem.
- **Kryteria:**
  - **Logika:** `core/map/movement.ts` udostępnia `getMovePath()` (najtańsza trasa), `moveTargets()` (wszystkie heksy osiągalne w budżecie) i `moveUnit()`, który odejmuje koszt trasy i ustawia `hasActed` tylko przy zerowym ruchu.
  - **Teren i kolizje:** trasa omija wodę i teren nieprzechodni, nie wchodzi na zajęte heksy i nie przekracza `movesLeft`; droga jest tańsza, las, bagno i góry droższe.
  - **Interfejs:** dozwolone heksy są zielone, trasa żółta, a pasek pokazuje instrukcję „1. klik — trasa · 2. klik — potwierdzenie ruchu”; zmiana wyboru i koniec tury czyszczą trasę.
  - **Animacja:** token przesuwa się po kolejnych heksach trasy, a `UnitLayer.setUnits(units, false)` nie nadpisuje jej skokiem do celu.
  - **Testy:** `tests/core/map/movement.test.ts` pokrywa koszt terenu, zasięg, zajęte heksy, wodę, koniec ruchu i wybór tańszej trasy zamiast krótszej.

## GRA-031: Kafelki terenu SVG z wariantami
- **Kontekst:** Autorskie kafelki SVG leżały w katalogu builda (`client/dist/assets/map/`), przez co ginęły przy `npm run build`. Część terenów ma dwa warianty tego samego kafla, a mapa nadal rysowała jednolite heksy.
- **Opis:** Pliki przeniesione do `client/src/assets/map/ai/` i nazwane `<TerrainId>-<wariant>.svg`. `view/terrainTiles.ts` ładuje je przez Vite i wybiera losowy wariant, a `HexMapView` podmienia teksturę przy tworzeniu i zmianie terenu (ADR-028). Tereny bez SVG zachowują proceduralny heks.
- **Kryteria:**
  - **Nazwy:** pliki odpowiadają ID terenu (`plain`, `water`, `city`) i numerowi wariantu; duplikat `city_tile_2_1.svg` nie jest używany.
  - **Warianty:** funkcja `pickVariantIndex(count, random)` w `core/map/terrain/variants.ts` zwraca indeks z zakresu `0..count-1`, a `tests/core/map/terrain/variants.test.ts` pokrywa brak wariantów i granice losowania.
  - **Widok:** łąka, woda i miasto używają SVG w edytorze, menu, podglądach i scenariuszu; las, góry, bagno i droga wyglądają jak wcześniej.
  - **Styk kafli:** rysunek wypełnia cały heks (bez ciemnego bevelu), a sprite zachodzi o 3% na sąsiadów, więc między kaflami nie prześwituje czarne tło.
  - **Paleta edytora:** podglądy terenu zachowują rozmiar heksa (~20 px), mimo że tekstura SVG ma 256 px; wybór kafelka skaluje je względem zapisanej skali bazowej, a nie przez `setScale(1)`.
  - **Build:** `npm run build` kopiuje SVG do `client/dist/assets`, więc kafelki działają po przebudowie i w Electronie. `assetsInlineLimit: 0` w `vite.config.ts` blokuje inline'owanie małych SVG, którego Phaser nie potrafi odczytać.

## GRA-032: Pusta lista w menu map
- **Kontekst:** `MapMenuScene.buildList()` zaczynał się od `this.scene.isActive()`. W Phaserze 4 podczas `create()` scena ma status `CREATING`, a nie `RUNNING`, więc warunek był zawsze fałszywy i lista map — razem z kartą „Nowa mapa” — nigdy się nie budowała.
- **Opis:** Usunięty strażnik na początku `buildList()`; karta nowej mapy dodaje się od razu, a strażnik po `await` nadal chroni przed dopisywaniem wierszy do zamkniętej sceny.
- **Kryteria:** Menu map pokazuje kartę „Nowa mapa” i zapisane mapy; wyjście z menu w trakcie ładowania nie dopisuje wierszy do nieistniejącej listy.

## GRA-033: Nowe grafiki kafelków i las
- **Kontekst:** Do `client/dist/assets` trafiła nowa partia autorskich kafelków SVG z nazwami z pobierania (`meadow_tile_1 (1).svg`, `city_tile_2 (2).svg`), obok starych plików. Las nie miał dotąd żadnego kafla SVG — rysowała go proceduralna tekstura.
- **Opis:** Pliki przeniesione do `client/src/assets/map/ai/` pod nazwy `<TerrainId>-<wariant>.svg`, stare grafiki zastąpione nowymi. `view/terrainTiles.ts` dostaje dwa warianty lasu i miasta (ADR-028).
- **Kryteria:**
  - **Nazwy:** pliki odpowiadają ID terenu (`plain`, `forest`, `water`, `city`) i numerowi wariantu; w katalogu nie zostają nazwy z pobierania ze spacjami i nawiasami.
  - **Las:** dwa kafelki (`forest-1.svg`, `forest-2.svg`) są wpisane w `terrainTiles.ts` i tasują się jak pozostałe.
  - **Miasto:** dwa warianty (`city-1.svg`, `city-2.svg`); dodatkowe układy zabudowy z drugiego pobrania nie są używane.
  - **Krawędzie:** grafiki są przycięte do pełnego heksa i nie mają ciemnej fazy na obwodzie, więc między kaflami nie widać czarnych pasków (ADR-028).
  - **Stare pliki:** poprzednie grafiki łąki, wody i miasta nie są już importowane ani obecne w `src/assets/map/`.
  - **Build:** `npm run build` kopiuje nowe SVG do `client/dist/assets`, a stare hashowane pliki znikają z katalogu builda.

## SRV-001: Warstwowy moduł auth z encją użytkownika
- **Kontekst:** Backend Symfony nie miał warstwy danych ani użytkowników. Przed dodaniem logowania trzeba było wpiąć Doctrine ORM, migracje i fixtury oraz ustalić granice modułu, żeby kontrolery nie mieszały się z regułami domenowymi.
- **Opis:** Moduł `App\Auth` z warstwami `Domain`, `Application`, `Infrastructure` i `Presentation` (ADR-029). Encja `User` z e-mailem, hashem hasła, rolami i datą utworzenia; e-mail jako wartość `Email` normalizująca małe litery. Repozytorium domenowe ma adapter Doctrine, a hashowanie i wystawianie tokenów są portami z adapterami Symfony/Lexik.
- **Kryteria:**
  - **Warstwy:** `Domain` nie importuje HTTP ani Lexika (mapowanie Doctrine i kontrakty Security są atrybutami encji); `Application` zna tylko porty i encję; `Infrastructure` zawiera repozytorium Doctrine, provider użytkownika, adaptery haseł/tokenów i fixtury; `Presentation` zawiera kontrolery, DTO i listener wyjątków.
  - **Encja:** `app_user` ma unikalny e-mail, hash hasła, role (domyślnie `ROLE_USER`) i `createdAt`; e-mail jest normalizowany i walidowany w `Email`.
  - **Baza:** Doctrine ORM mapuje `src/Auth/Domain`; migracja tworzy tabelę `app_user`, a `make migrate` ją wykonuje.
  - **Fixtury:** `make fixtures` tworzy `admin@example.com` i `gracz@example.com`, nie duplikuje istniejących kont.
  - **Dokumentacja:** ADR-029 i `specification/API.md` opisują decyzję i kontrakt.

## SRV-002: Rejestracja i logowanie JWT
- **Kontekst:** Po dodaniu encji użytkownika potrzebny był publiczny sposób rejestracji i logowania oraz ochrona przyszłych endpointów API. Klient ma dostawać token, a nie polegać na sesji cookies.
- **Opis:** Endpointy `POST /api/auth/register`, `POST /api/auth/login` i `GET /api/auth/me` (API-001). Rejestracja sprawdza unikalność e-maila, hashuje hasło i od razu wystawia JWT. Logowanie weryfikuje hash i zwraca token. Firewall `api` jest bezstanowy, używa Lexika, a `me` wymaga `IS_AUTHENTICATED_FULLY`. Błędy domenowe mapuje listener na `409`/`401`.
- **Kryteria:**
  - **Rejestracja:** `201` z tokenem i użytkownikiem; e-mail normalizowany; duplikat `409`; zły payload `422`.
  - **Logowanie:** `200` z tokenem; złe dane `401` bez ujawniania, czy konto istnieje; brak pól `422`.
  - **Token:** JWT `RS256`, TTL 3600 s, nagłówek `Authorization: Bearer`; `me` zwraca konto, a bez tokenu `401`.
  - **Bezpieczeństwo:** hasła nigdy nie wracają w odpowiedzi; hashowanie przez Symfony; endpointy auth są jedynymi publicznymi pod `/api`.
  - **Testy:** `make test-server` pokrywa rejestrację, duplikat, walidację, logowanie, `me` z tokenem i bez.
  - **Dokumentacja:** `specification/API.md`, ADR-029 i `specification/Infrastruktura.md` opisują endpointy, zmienne i komendy.

## INFRA-002: Testy jednostkowe i mutacyjne w CI
- **Kontekst:** Pipeline `.github/workflows/ci.yml` sprawdzał wyłącznie typy klienta, a Vitest uruchamiał się tylko lokalnie przez `make test`. Testów mutacyjnych nie było, więc jakość asercji nie była mierzona.
- **Opis:** CI ma trzy równoległe joby: typy, testy jednostkowe (`npm test`) i testy mutacyjne (`npm run mutation`). Mutacje liczy Stryker dla `client/src/core/**/*.ts`, a raport HTML/JSON trafia do artefaktu `mutation-report`.
- **Kryteria:**
  - **Testy jednostkowe:** job `Testy jednostkowe` uruchamia `npm test` po `npm ci` i obala pipeline przy czerwonym Vitest.
  - **Mutacje:** konfiguracja w `client/stryker.config.mjs` (runner `vitest`, zakres `src/core`), progi `high 80` / `low 60` / `break 50`; wynik poniżej progu obala job.
  - **Raport:** `client/reports/` jest ignorowany przez git, a w CI publikowany jako artefakt także przy nieudanym jobie.
  - **Lokalnie:** `make mutation` i `npm run mutation` dają ten sam wynik co CI.
  - **Dokumentacja:** `specification/Infrastruktura.md` opisuje zakres, progi i artefakt pipeline'u.

## INFRA-003: Testy backendu i mutacje w CI
- **Kontekst:** Pipeline sprawdzał tylko klienta; PHPUnit działał wyłącznie lokalnie, a Infection nie był w ogóle skonfigurowany, więc regresje w `server/src/` przechodziły przez CI niezauważone.
- **Opis:** Dwa nowe joby w `.github/workflows/ci.yml` — `Testy backendu` (`php bin/phpunit`) i `Testy mutacyjne backendu` (`vendor/bin/infection`). PHP 8.4 z PCOV, SQLite w `APP_ENV=test`, para kluczy JWT generowana przed testami. Konfiguracja Infection w `server/infection.json5`.
- **Kryteria:**
  - **PHPUnit:** job instaluje zależności Composera z cache i obala pipeline, gdy testy backendu są czerwone.
  - **Infection:** mutuje `server/src/`, progi `minMsi 80` i `minCoveredMsi 90`; raport `server/var/infection/` trafia do artefaktu `server-mutation-report` także przy nieudanym jobie.
  - **Logi testów:** w `APP_ENV=test` logger jest wyciszony (`server/config/services_test.yaml`), bo Infection traktuje zapis na stderr jako błąd initial tests.
  - **Documentacja:** `specification/Infrastruktura.md` opisuje joby, progi i artefakty.

## INFRA-004: Paczka Electrona dla Windows z WSL
- **Kontekst:** `make electron-build` budował wyłącznie rozpakowaną paczkę dla bieżącego systemu, a `files` w `electron/package.json` nie pakowało `client/dist`. Paczka nie miała więc `index.html`, a `main.cjs` wskazywał na ścieżkę spoza `resources/`. Na WSL nie było też sposobu na zbudowanie `.exe` bez ręcznego wywoływania `electron-builder`.
- **Opis:** `extraResources` kopiuje `client/dist` do `resources/client/dist`, a spakowane okno ładuje je przez własny schemat `app://bundle/` (`electron/distServer.cjs`) zamiast `file://`. Nowe cele: `build:win` (ZIP z `win-unpacked`, bez wine) i `build:win:installer` (NSIS + portable, wymaga wine), plus `make electron-win` i `make electron-win-installer`. `make electron` nadal ładuje Vite z kontenera, a schemat `app://` obsługuje wyłącznie paczkę.
- **Kryteria:**
  - **ZIP:** `make electron-win` tworzy `electron/release/My Very Advance Wars-<wersja>-win.zip` zawierający `win-unpacked` z `resources/client/dist/index.html` i `assets/`; build nie wymaga wine.
  - **Instalator:** `make electron-win-installer` buduje NSIS i portable `.exe`; na WSL bez `wine` kończy się czytelnym błędem, a dokumentacja podaje sposób instalacji.
  - **Działanie paczki:** `app://bundle/index.html` serwuje assety Vite, `sql-wasm.wasm` wraca `200`, a `localStorage` działa — sprawdzone sondą Electrona na `client/dist`.
  - **Zgodność:** `make electron` i `make electron-build` zachowują dotychczasowe zachowanie, a `specification/Infrastruktura.md` i `specification/Mapy.md` opisują nowe cele, origin packaged i wymóg wine.

## GRA-034: Wzmocnienie testów pod mutacje
- **Kontekst:** Pierwszy przebieg Strykera (INFRA-002) dał 61% i odsłonił pliki z niskim pokryciem zachowań: `scenario.ts` (32%), `map/catalog.ts` (22%) i `state.ts` (61%). Testy sprawdzały głównie, że jednostki powstają, a nie gdzie dokładnie trafiają ani których heksów unikają.
- **Opis:** Nowe testy katalogu map (metadane, wymiary, konkretne kafle malowane prostokątami) oraz rozbudowa testów scenariusza (puste mapy, dokładne kolumny i rzędy rozmieszczenia, pomijanie wody, brakujących kafli i heksów zajętych) i ruchu (`canMoveUnit`, `getMovePath`, `getMoveCost`, zachowanie przy zużytym ruchu).
- **Kryteria:**
  - **Katalog map:** oba wbudowane układy mają sprawdzone metadane, granice, liczbę kafli i teren w rogach każdego malowanego prostokąta; `findMapDefinition` znajduje wpis po identyfikatorze i zwraca `undefined` dla nieznanego.
  - **Scenariusz:** pusta mapa nie dodaje jednostek; brakująca strona dostaje dokładnie 10 jednostek w ustalonej kolejności rodzajów, niebieska od lewej, czerwona od prawej; woda, brakujące kafle i heksy zajmowane przez drugą stronę są pomijane, a istniejące jednostki nie są nadpisywane.
  - **Ruch:** `canMoveUnit` odrzuca ten sam heks, heks nieprzyległy, zajęty, wodę, cel droższy niż pozostały ruch i jednostkę, która już działała; `getMoveCost` zwraca `IMPASSABLE` dla brakującego kafla; `getMovePath` odrzuca cel tożsamy z pozycją, zajęty, wodę i jednostkę bez ruchu.
  - **Wynik:** pełny przebieg Strykera po zmianach daje 80,39% (676 zabitych, 21 timeoutów, 126 przeżytych, 44 bez pokrycia, 40 błędów na 907 mutantów) zamiast 61,01% przed zmianą; testy i `tsc --noEmit` pozostają zielone.

## GRA-035: Kolorystyka interfejsu zależna od tury
- **Kontekst:** Pasek dowodzenia ma stałe zielone akcenty, więc gracz nie widzi na pierwszy rzut oka, czyja jest tura — aktywną stronę zdradza tylko tekst.
- **Opis:** Akcenty paska dowodzenia zmieniają się wraz z aktywną stroną: niebieska tura używa błękitu, czerwona — czerwieni. Paleta obejmuje tło paska, obwódkę i górną linię, separatory, przycisk „ZAKOŃCZ TURĘ” (tło, obwódka, hover), kolory hover odnośników oraz etykietę tury. Tło i układ paska pozostają bez zmian.
- **Kryteria:**
  - **Zmiana tury:** po `T` lub „ZAKOŃCZ TURĘ” akcenty przełączają się na kolor nowej strony bez przebudowy sceny.
  - **Czytelność:** teksty i przyciski pozostają czytelne na ciemnym tle, a kolory nie zmieniają znaczenia żółtej trasy ani białego kursora.
  - **Zakres:** zmiana dotyczy wyłącznie warstwy widoku — `core/` i zapis scenariusza pozostają bez zmian.

## GRA-036: Symulacja ruchu w module mapy
- **Kontekst:** `client/src/core/state.ts` łączył stan gry (mapa, jednostki, licznik) z symulacją ruchu, choć reguły ruchu zależą głównie od mapy i terenu. Plik rósł razem z pathfindingiem i utrudniał odnalezienie operacji stanu.
- **Opis:** Symulacja ruchu przenosi się do `client/src/core/map/movement.ts`: `findUnitAt`, `getMoveCost`, `canMoveUnit`, `getMovePath`, `moveTargets`, `moveUnit`. `core/map/index.ts` re-eksportuje moduł, więc scena i widoki importują reguły ruchu z `core/map`. `core/state.ts` zostaje przy `GameState` i mutacjach jednostek (`placeUnit`, `removeUnitAt`, `clearUnits`, `deployUnits`, `countUnits`).
- **Kryteria:**
  - **Brak cyklu:** `map/movement.ts` zna `GameState` wyłącznie przez import typu, a `state.ts` nie importuje modułu ruchu w czasie działania.
  - **Zachowanie:** trasa, koszt terenu, zasięg ruchu i oznaczenie `hasActed` działają jak przed przeniesieniem.
  - **Testy:** testy ruchu leżą w `tests/core/map/movement.test.ts`, a `tests/core/state.test.ts` pokrywa wyłącznie operacje stanu.

## GRA-037: Moduł integracji z SQLite
- **Kontekst:** Inicjalizacja `sql.js`, plik WASM i trwałość bazy w `localStorage` leżały w `client/src/storage/` obok repozytorium map. Warstwa magazynu mieszała więc dostęp do zewnętrznego silnika z logiką domenową.
- **Opis:** Powstaje moduł `client/src/integrations/` z podmodułem `sqlite/`. `openDatabase()` i `persistDatabase()` przenoszą się do `integrations/sqlite/database.ts`, a `integrations/sqlite/index.ts` re-eksportuje publiczny interfejs. `storage/maps.ts` korzysta z integracji, zachowując schemat, seed i operacje na mapach.
- **Kryteria:**
  - **Granica:** `integrations/` zna wyłącznie `sql.js`, WASM i `localStorage`; nie importuje modułów gry.
  - **Zachowanie:** baza nadal otwiera się z `mvaw:sqlite`, a zapis mapy persists plik bez zmian formatu.
  - **Dokumentacja:** ścieżki w ADR-017, `Mapy.md`, `Interfejs.md` i `Infrastruktura.md` wskazują nowy moduł.

## GRA-038: Mgła wojny i zasięg wzroku jednostek
- **Kontekst:** Scenariusz pokazywał tokeny wszystkich jednostek obu stron, więc przeciwnik był widoczny niezależnie od położenia własnego wojska. Do rozgrywki potrzebna jest mgła wojny sterowana flagą mapy i zasięgiem wzroku jednostek.
- **Opis:** `UnitStats` dostaje `visionRange`, a `GameMap` — flagę `fogOfWar`. Czysty moduł `client/src/core/vision.ts` liczy widoczność z perspektywy aktywnej strony: własne jednostki są zawsze widoczne, a wrogie tylko wtedy, gdy leżą w zasięgu wzroku dowolnej jednostki tej strony (odległość heksagonalna). `ScenarioScene` rysuje wyłącznie widoczne tokeny, a kliknięcie i podgląd heksu nie ujawniają ukrytej jednostki. Edytor ma przełącznik `MGŁA WOJNY` w lewym panelu, a `mapSerialization` zapisuje flagę i domyśla się `false` dla starszych zapisów. Scenariusz `front-wschodni` włącza mgłę także na starszym wpisie z SQLite przez `withFogOfWar`.
- **Kryteria:**
  - **Dane:** piechota ma zasięg wzroku 2, czołg 3, artyleria 2, zwiad 5; wartości są w `UNIT_DEFS`.
  - **Mapa:** `GameMap.fogOfWar` domyślnie `false`, a operacje na kaflach zachowują flagę; nowa mapa i `clearMap()` startują z wyłączoną mgłą.
  - **Widoczność:** przy włączonej mgle tokeny wroga poza zasięgiem znikają, jednostki w zasięgu dowolnej własnej jednostki pozostają widoczne, a po zakończeniu tury widoczność przełącza się na nową stronę.
  - **Interakcja:** ukrytej jednostki nie da się wybrać ani zobaczyć jej opisu w podglądzie heksu; edytor nadal pokazuje wszystkie jednostki.
  - **Zapis:** flaga przechodzi round-trip w SQLite, brak flagi w starym zapisie oznacza `false`, a niepoprawna wartość jest odrzucana.
  - **Testy:** `tests/core/vision.test.ts`, `tests/core/map/model.test.ts`, `tests/core/scenario.test.ts` i `tests/storage/mapSerialization.test.ts` pokrywają logikę i format.
  - **Dokumentacja:** ADR-030, `Mapy.md`, `Interfejs.md` i `Zadania.md` opisują flagę, zasięgi i zachowanie scenariusza.

## GRA-039: Zasięgi ruchu, wzroku i strzału na mapie
- **Kontekst:** Po wybraniu jednostki scena rysowała wyłącznie zasięg ruchu. Zasięg wzroku istniał tylko w logice mgły wojny, a statystyka `attack` nie miała odpowiadającego jej zasięgu, więc gracz nie widział, które heksy jednostka może razić.
- **Opis:** `UnitStats` dostaje `attackRange`, a czysty moduł `client/src/core/ranges.ts` liczy heksy w promieniu od pozycji jednostki (`hexesInRange`) oraz gotowe zestawy dla wzroku i strzału (`visionTiles`, `attackTiles`). `ScenarioScene` po wybraniu jednostki rysuje zagnieżdżone podpowiedzi: ruch (zielony, zewnętrzny) i strzał (czerwony, wewnętrzny); wzrok był niebieskim obrysem, później zastąpionym mgłą w GRA-048. Ruch liczy nadal `moveTargets()` i pokazuje się tylko dla jednostki aktywnej strony; wzrok i strzał pokazują się dla każdej wybranej, widocznej jednostki. Pasek dowodzenia ma osobną linię zasięgów w tych samych kolorach: ruch (`movesLeft/moveRange`), wzrok i strzał.
- **Kryteria:**
  - **Dane:** piechota ma zasięg strzału 1, czołg 1, artyleria 3, zwiad 1; wartości są w `UNIT_DEFS` obok `visionRange`.
  - **Zasięgi:** obrysy obejmują wyłącznie istniejące kafle mapy, bez heksa jednostki; wzrok i strzał nie zależą od terenu ani zajętości heksu.
  - **Ruch:** zasięg ruchu działa jak dotąd — koszt terenu, zajęte heksy i `movesLeft`; poza turą jednostki nie rysuje się.
  - **Pasek:** wybrana jednostka pokazuje w dolnym pasku zasięg ruchu na zielono, wzroku na niebiesko i strzału na czerwono, zgodnie z kolorami podpowiedzi na mapie.
  - **Widoczność:** mgła wojny nie zmienia się; ukrytej jednostki nadal nie da się wybrać, a obrysy nie ujawniają jej pozycji.
  - **Testy:** `tests/core/ranges.test.ts` pokrywa promień, filtrowanie do kafli i wartości z `UNIT_DEFS`; testy scenariusza i map pozostają bez regresji.
  - **Dokumentacja:** ADR-031, `Mapy.md` i `Interfejs.md` opisują nową właściwość i kolory obrysów. GRA-041 zmienia zasięg artylerii na pełną mapę.

## GRA-040: Atak jednostek z obrażeniami i usuwaniem
- **Kontekst:** Zasięg strzału był tylko obrysem na mapie — kliknięcie wrogiej jednostki w zasięgu wybierało ją zamiast atakować. Statystyka `attack` i pole `hp` nie miały zastosowania w rozgrywce, więc walki nie było.
- **Opis:** Czysty moduł `client/src/core/combat.ts` udostępnia `canAttack()` i `attackUnit()`. Atak jest dozwolony, gdy wybrana jednostka należy do aktywnej strony, nie działała jeszcze w tej turze, a cel jest wrogiem w promieniu `attackRange`. Obrażenia są równe `attack` atakującego i odejmowane od `hp` celu; jednostka z `hp <= 0` znika ze stanu. Atak kończy akcję jednostki (`hasActed`), więc ta sama jednostka nie zaatakuje dwa razy w turze. `ScenarioScene` przechwytuje kliknięcie w widocznego wroga w zasięgu przed wyborem jednostki i odświeża tokeny, zasięgi oraz pasek.
- **Kryteria:**
  - **Dozwolony atak:** własna jednostka aktywnej strony, bez `hasActed`, cel wrogi i w odległości nie większej niż `attackRange`.
  - **Obrażenia:** `hp` celu spada o `attack` atakującego; obrona i teren nie zmniejszają obrażeń.
  - **Śmierć:** przy `hp <= 0` jednostka jest usuwana ze `state.units`, a jej token znika z mapy.
  - **Akcja:** po ataku atakujący dostaje `hasActed` i nie może ponownie zaatakować ani ruszyć się do końca tury.
  - **Interakcja:** kliknięcie wroga poza zasięgiem nie zadaje obrażeń; ukrytej jednostki nadal nie da się zaatakować. Podgląd heksu pokazuje HP widocznej jednostki.
  - **Testy:** `tests/core/combat.test.ts` pokrywa obrażenia, śmierć, zasięg, własną stronę, limit akcji i wartości z `UNIT_DEFS`.
  - **Dokumentacja:** ADR-032, `Mapy.md` i `Interfejs.md` opisują obrażenia, warunki ataku i zachowanie sceny.

## GRA-041: Artyleria z pełnym zasięgiem i ruchowym kosztem strzału
- **Kontekst:** Artyleria miała zasięg strzału 3 przy zasięgu wzroku 2, więc bez podpierania jej inną jednostką nie widziała celów, które mogła razić. Strzał kończył też całą akcję (`hasActed`), więc po dojściu do wroga jednostka nie mogła już atakować. Długi zasięg był w praktyce bezużyteczny, a pole `ammo` nie było widoczne ani zużywane.
- **Opis:** `UNIT_DEFS.artillery` ma nieskończony `attackRange` i `visionRange` — artyleria widzi i razi każdy heks mapy. Strzał artylerii nie ustawia od razu `hasActed`: odejmuje od `movesLeft` stałą proporcję `moveRange / ARTILLERY_AMMO` (`ARTILLERY_SHOT_MOVE_COST`) oraz zużywa jeden pocisk. Pełny zapas ruchu wystarcza na tyle strzałów, ile wynosi `ammo`; dopiero wyczerpanie ruchu ustawia `hasActed`. Każdy atak (także czołgu) zmniejsza `ammo` o 1, a `canAttack()` odrzuca jednostkę bez pocisków. `beginTurn()` uzupełnia amunicję jednostkom aktywnej strony do wartości z `UnitStats.ammo`. Pozostałe rodzaje jednostek nadal kończą akcję po jednym ataku. Scena rysuje dla artylerii czerwone obrysy wyłącznie na widocznych wrogach i pomija mgłę wzroku (cała mapa), a pasek pokazuje `Wzrok ∞`, `Strzał ∞`, `POCISKI X/6` i ułamkowy ruch z dokładnością do dwóch miejsc.
- **Kryteria:**
  - **Zasięg:** artyleria widzi i atakuje wroga na dowolnym heksie mapy; warunki własnej strony pozostają bez zmian.
  - **Koszt strzału:** każdy strzał odejmuje `moveRange / ammo` od bieżącego `movesLeft`; po wyczerpaniu ruchu jednostka dostaje `hasActed`.
  - **Amunicja:** każdy atak zużywa 1 pocisk; przy `ammo = 0` `canAttack()` zwraca `false`. Pociski wracają do maksimum na początku tury strony.
  - **Seria:** artyleria może strzelać wielokrotnie w turze, dopóki ma ruch i pociski.
  - **Inne jednostki:** piechota, czołg i zwiad po ataku nadal dostają `hasActed` bez zużywania ruchu; czołg dodatkowo zużywa pocisk.
  - **Interfejs:** HUD pokazuje `Wzrok ∞`, `Strzał ∞`, `POCISKI X/6`, ruch z częścią dziesiętną, a obrysy strzału obejmują tylko widocznych wrogów zamiast całej mapy.
  - **Testy:** `tests/core/combat.test.ts` pokrywa pełny zasięg, koszt ruchu, amunicję, serię strzałów i zachowanie innych jednostek; `vision.test.ts` i `ranges.test.ts` — pełny wzrok; `turn.test.ts` — uzupełnianie pocisków; `movement.test.ts` — ułamkowy ruch.
  - **Dokumentacja:** ADR-033, `Mapy.md` i `Interfejs.md` opisują zasięgi, amunicję i koszt strzału artylerii.

## GRA-042: Menu kampanii z wstążkami i kafelkami samouczka
- **Kontekst:** Menu główne prowadziło tylko do scenariuszy i edytora map, więc nie było wejścia do kampanii ani samouczka. Potrzebny jest osobny ekran z zakładkami w stylu wstążki Worda, który pomieści misje samouczka i przyszłe kampanie.
- **Opis:** Menu główne dostaje jako pierwszą pozycję „Kampanie”, która otwiera nową scenę `CampaignMenuScene`. Scena rysuje pasek trzech wstążek (`Samouczek`, `Kampania 1`, `Kampania 2`) i panel treści pod nim. Samouczek pokazuje sześć kafelków w siatce 3×2; pierwszy to „Pierwsze kroki”, a kolejne to „Ruch jednostek”, „Walka”, „Mgła wojny”, „Amunicja” i „Artyleria”. Kafelki są zapowiedziami: mają numer, tytuł, opis i status „WKRÓTCE”, a kliknięcie pokazuje komunikat o planowanej misji. Kampanie 1 i 2 pokazują pusty panel do czasu dodania misji. Dane kampanii są czystym modułem `core/campaign.ts`, a rysowanie wstążek i kafelków trafia do `view/`.
- **Kryteria:**
  - **Menu główne:** „Kampanie” jest pierwszą pozycją i otwiera `CampaignMenuScene`.
  - **Wstążki:** trzy zakładki w kolejności „Samouczek”, „Kampania 1”, „Kampania 2”; aktywna jest wyróżniona, przełączanie podmienia zawartość bez zmiany sceny.
  - **Samouczek:** sześć kafelków w siatce 3×2, pierwszy zatytułowany „Pierwsze kroki”.
  - **Kafelki:** każdy ma numer, tytuł, krótki opis i status „WKRÓTCE”; kliknięcie zaznacza kafelek i pokazuje komunikat o planowanej misji.
  - **Pozostałe kampanie:** panel pokazuje brak misji, a wstążki nadal działają.
  - **Sterowanie:** LPM wybiera wstążkę lub kafelek, `ESC` i „MENU GŁÓWNE” wracają do menu głównego.
  - **Testy:** `tests/core/campaign.test.ts` sprawdza kolejność kampanii, liczbę kafelków samouczka, tytuł pierwszego kafelka i brak kafelków w kampaniach 1/2.
  - **Dokumentacja:** INTERF-001, INTERF-007 i ZAL-011 opisują wejście, ekran i zawartość kampanii.

## GRA-043: Pierwsza misja samouczka — Pierwsze kroki
- **Kontekst:** Kafelki samouczka były tylko zapowiedziami, więc nie dało się sprawdzić kampanii w grze. Potrzebna jest pierwsza grywalna misja i podział danych na osobne pliki, żeby kolejne misje i kampanie nie rosły w jednym module.
- **Opis:** Dane kampanii przechodzą do katalogu `client/src/core/campaign/`: `types.ts` trzyma typy, `tutorial.ts`, `kampania-1.ts` i `kampania-2.ts` opisują kampanie, a `missions/` zawiera po jednym pliku na misję. Pierwsza misja „Pierwsze kroki” dostaje własny `missions/pierwsze-kroki.ts` z prostą mapą 16×10, trzema niebieskimi piechurami i jednym czerwonym piechurom ustawionym poza zasięgiem wzroku. Mapa ma włączoną mgłę wojny, więc wróg jest niewidoczny do czasu zbliżenia jednostki. Kafelek z gotową misją pokazuje status „GRAJ” i uruchamia `ScenarioScene`; dolny pasek prowadzi z powrotem do „MENU KAMPANII”. Pozostałe kafelki i kampanie pozostają zapowiedziami.
- **Kryteria:**
  - **Struktura:** każda kampania ma osobny plik, a każda misja osobny plik w `core/campaign/missions/`; `index.ts` tylko scala dane.
  - **Mapa:** prosta mapa 16×10 z kilkoma kaflami terenu, bez przeszkód blokujących start jednostek.
  - **Jednostki:** trzech niebieskich piechurów po lewej stronie i jeden czerwony piechur po prawej.
  - **Mgła:** mapa ma włączoną mgłę wojny, a `visibleUnits` dla niebieskich nie zwraca czerwonego piechura na starcie.
  - **Uruchomienie:** kliknięcie „Pierwsze kroki” otwiera scenariusz z tą mapą i armią; pozostałe kafelki nadal pokazują „WKRÓTCE”.
  - **Powrót:** dolny pasek misji prowadzi do „MENU KAMPANII”, a nie do listy scenariuszy.
  - **Testy:** `tests/core/campaign/` sprawdza kolejność kampanii, kafelki samouczka, skład armii i ukrycie wroga w mgle.
  - **Dokumentacja:** ZAL-011, INTERF-007 i GRA-043 opisują strukturę plików, mapę i uruchomienie misji.

## GRA-044: Zasięg strzału zgodny z akcją jednostki
- **Kontekst:** W pierwszej misji samouczka czerwony piechur jest widoczny z odległości dwóch heksów, ale piechota atakuje tylko z jednego. Po dojściu na sąsiedni heks wyczerpanie ruchu ustawia `hasActed`, a scena nadal rysuje czerwony obrys zasięgu strzału. Kliknięcie wroga nie zadaje wtedy obrażeń, więc interfejs obiecuje akcję, której `canAttack()` nie pozwala wykonać. Po ruchu scena dodatkowo czyści wszystkie obrysy, więc znika też informacja o pozostałym ruchu i wzroku.
- **Opis:** Czysty moduł `client/src/core/combat.ts` dostaje `canAttackThisTurn()`, które wydziela warunki atakującego: brak `hasActed` i dodatnią amunicję. `canAttack()` korzysta z tej funkcji, więc zasady walki pozostają bez zmian. `ScenarioScene` rysuje czerwony zasięg strzału wyłącznie dla jednostki aktywnej strony, która może jeszcze atakować; po potwierdzeniu ruchu odtwarza obrysy przez `drawRangeHints()` zamiast je czyścić, dzięki czemu nadal zaznaczona jednostka pokazuje aktualny ruch, wzrok i ewentualny zasięg strzału.
- **Kryteria:**
  - **Zasięg strzału:** czerwony obrys pojawia się tylko dla jednostki aktywnej strony bez `hasActed` i z dodatnią amunicją; jednostka po ataku albo po wyczerpaniu ruchu go nie pokazuje.
  - **Po ruchu:** nadal zaznaczona jednostka od razu pokazuje aktualne obrysy; zielony ruch znika, gdy `movesLeft` spadnie do zera, a wzrok i strzał wynikają z bieżącego stanu.
  - **Zasady:** `canAttack()` zachowuje dotychczasowe warunki i zachowanie; nowa funkcja nie zmienia ruchu, obrażeń ani amunicji.
  - **Testy:** `tests/core/combat.test.ts` pokrywa `canAttackThisTurn()` dla jednostki gotowej, po akcji i bez amunicji.
  - **Dokumentacja:** INTERF-005 i GRA-044 opisują widoczność obrysu strzału oraz odświeżanie zasięgów po ruchu.

## GRA-044: Zasięg strzału zgodny z akcją jednostki
- **Kontekst:** W pierwszej misji samouczka czerwony piechur jest widoczny z odległości dwóch heksów, ale piechota atakuje tylko z jednego. Po dojściu na sąsiedni heks wyczerpanie ruchu ustawia `hasActed`, a scena nadal rysuje czerwony obrys zasięgu strzału. Kliknięcie wroga nie zadaje wtedy obrażeń, więc interfejs obiecuje akcję, której `canAttack()` nie pozwala wykonać. Po ruchu scena dodatkowo czyści wszystkie obrysy, więc znika też informacja o pozostałym ruchu i wzroku.
- **Opis:** Czysty moduł `client/src/core/combat.ts` dostaje `canAttackThisTurn()`, które wydziela warunki atakującego: brak `hasActed` i dodatnią amunicję. `canAttack()` korzysta z tej funkcji, więc zasady walki pozostają bez zmian. `ScenarioScene` rysuje czerwony zasięg strzału wyłącznie dla jednostki aktywnej strony, która może jeszcze atakować; po potwierdzeniu ruchu odtwarza obrysy przez `drawRangeHints()` zamiast je czyścić, dzięki czemu nadal zaznaczona jednostka pokazuje aktualny ruch, wzrok i ewentualny zasięg strzału.
- **Kryteria:**
  - **Zasięg strzału:** czerwony obrys pojawia się tylko dla jednostki aktywnej strony bez `hasActed` i z dodatnią amunicją; jednostka po ataku albo po wyczerpaniu ruchu go nie pokazuje.
  - **Po ruchu:** nadal zaznaczona jednostka od razu pokazuje aktualne obrysy; zielony ruch znika, gdy `movesLeft` spadnie do zera, a wzrok i strzał wynikają z bieżącego stanu.
  - **Zasady:** `canAttack()` zachowuje dotychczasowe warunki i zachowanie; nowa funkcja nie zmienia ruchu, obrażeń ani amunicji.
  - **Testy:** `tests/core/combat.test.ts` pokrywa `canAttackThisTurn()` dla jednostki gotowej, po akcji i bez amunicji.
  - **Dokumentacja:** INTERF-005 i GRA-044 opisują widoczność obrysu strzału oraz odświeżanie zasięgów po ruchu.

## GRA-045: Obrys zasięgu wzroku po krawędziach heksów
- **Kontekst:** Zasięg wzroku był rysowany jako osobny, pomniejszony obrys w każdym heksie. Sąsiednie kafle dublowały wspólne krawędzie, więc obszar wyglądał jak siatka wewnętrznych ramek, a nie jak jeden zasięg. Granica nie pokrywała się też z rzeczywistymi krawędziami heksów.
- **Opis:** Czysta funkcja `hexBoundaryEdges()` w `client/src/core/map/layout.ts` zbiera krawędzie heksów z podanych środków i zwraca tylko te, które występują raz — czyli zewnętrzną granicę obszaru, także wokół dziur po brakujących kaflach. `view/hexGrid.ts` dostaje `outlineHexArea()`, które rysuje tę granicę jedną niebieską linią. `ScenarioScene` używa jej dla zasięgu wzroku zamiast obrysowywać każdy kafel osobno; ruch i strzał nadal korzystają z obrysów kafli. Wzrok jest rysowany po ruchu i strzale, więc niebieska granica leży nad zielonymi i czerwonymi obrysami i jest widoczna od razu po wybraniu jednostki. Rozwiązanie zostało zastąpione przez GRA-048 (mgiełka zamiast obrysu).
- **Kryteria:**
  - **Granica:** pojedynczy heks daje sześć krawędzi, dwa sąsiednie heksy dziesięć, a dwa rozłączne dwanaście.
  - **Rysowanie:** zasięg wzroku to jedna linia po zewnętrznych krawędziach heksów, bez wewnętrznych ramek i bez dublowania wspólnych krawędzi.
  - **Widoczność:** wzrok pojawia się natychmiast po wybraniu jednostki, także gdy jednostka ma jeszcze ruch; kolejność warstw nie pozwala zielonym obrysom ruchu zasłonić niebieskiej granicy.
  - **Zakres:** zmiana dotyczy wyłącznie wizualizacji wzroku; ruch, strzał, mgła wojny i zasady gry pozostają bez zmian.
  - **Testy:** `tests/core/map/layout.test.ts` pokrywa liczbę i unikalność krawędzi granicy dla jednego heksa, pary sąsiadów i obszarów rozłącznych.
  - **Dokumentacja:** ADR-031 i INTERF-005 opisują obrys wzroku po krawędziach heksów.

## GRA-046: Przycisk kupowania jednostek z oknem podglądu
- **Kontekst:** Dolny pasek scenariusza nie miał wejścia do rekrutacji, a gracz nie mógł zobaczyć jednostki przed dodaniem jej do armii. Ekonomia i właściwa rekrutacja są poza zakresem (ZAL-009), więc potrzebne jest najpierw miejsce i okno podglądu.
- **Opis:** `ScenarioCommandBar` dostaje pionowy przycisk `KUP` (44×88) w środkowej części paska, pod skrótami menu, z ikoną piechura w kolorze aktywnej strony i podpisem `KUP`. Kliknięcie otwiera nowe modalne okno `view/recruitDialog.ts`: przyciemnione tło, panel w kolorach aktywnej strony, po lewej lista czterech rodzajów jednostek (ikona, nazwa, rola), po prawej portret wybranego. Dla piechoty `view/recruitPortrait.ts` rysuje proceduralny obrys żołnierza, którego kolory zmieniają się po wyborze wyposażenia: kask, mundur, broń i plecak (po trzy warianty każde). Dla pojazdów prawa strona pokazuje powiększony token jednostki, a ich listy wyposażenia (pancerz, wieża, działo itd.) pozostają podglądem. Okno pokazuje też nazwę, rolę i statystyki z `UNIT_DEFS` (HP, atak, obrona, amunicja, ruch, wzrok, strzał). Jest częścią kamery interfejsu, blokuje kliknięcia w mapę i zamyka się przyciskiem `ZAMKNIJ`, kliknięciem w tło albo `ESC`. Nie zmienia `GameState`, nie pobiera punktów i nie stawia jednostki; wybór wyposażenia jest kosmetyczny.
- **Kryteria:**
  - **Przycisk:** pionowy `KUP` z grafiką piechura jest widoczny w pasku dowodzenia i otwiera okno po kliknięciu.
  - **Lista:** po lewej stronie okna widać cztery rodzaje jednostek; kliknięcie wiersza przełącza podgląd i podświetla wybór.
  - **Podgląd i wyposażenie:** piechota ma obrys żołnierza reagujący na kask, mundur, broń i plecak; pojazdy pokazują powiększony token, a ich opcje wyposażenia działają jako podgląd.
  - **Modalność:** przy otwartym oknie kliknięcia i kółko myszy nie sterują mapą; `ESC` zamyka okno zamiast wychodzić ze scenariusza.
  - **Brak wpływu na stan:** otwarcie, zamknięcie i zmiana wyposażenia nie zmieniają jednostek, tur, ruchu ani zapisu mapy.
  - **Dokumentacja:** INTERF-005 opisuje przycisk, listę jednostek i podgląd wyposażenia.

## GRA-047: Ruch w pasku po akcji jednostki
- **Kontekst:** Piechota, czołg i zwiad po ataku dostają `hasActed`, ale zachowują pełne `movesLeft`. Dolny pasek pokazywał wtedy np. `Ruch 2/2`, więc wyglądało to tak, jakby jednostka nadal mogła się ruszyć, mimo że ruch był zablokowany.
- **Opis:** `ScenarioCommandBar.refreshUnit()` liczy `canMove` z `!current.hasActed && current.movesLeft > 0`. Gdy jednostka nie może już działać, pasek pokazuje `Ruch 0/moveRange` i szarzeje tę wartość; jednostka gotowa do ruchu nadal pokazuje rzeczywiste `movesLeft` na zielono. Status „Działała — ruch w następnej turze” pozostaje bez zmian. Poprawka jest wyłącznie prezentacyjna i nie zmienia `GameState`.
- **Kryteria:**
  - **Po akcji:** jednostka z `hasActed` pokazuje `Ruch 0/...` i nie sugeruje dostępnego ruchu.
  - **Gotowa:** jednostka bez `hasActed` i z `movesLeft > 0` pokazuje rzeczywisty zapas ruchu na zielono.
  - **Artyleria:** po strzale z pozostałym ruchem nadal pokazuje ułamkowe `movesLeft`; dopiero `hasActed` zeruje prezentowany ruch.
  - **Brak wpływu na stan:** zmiana nie modyfikuje jednostek, tur ani zapisu mapy.
  - **Dokumentacja:** INTERF-005 opisuje zachowanie wskaźnika ruchu po akcji.

## GRA-048: Mgiełka zasięgu wzroku
- **Kontekst:** Zasięg wzroku był niebieską linią po krawędziach heksów. Granica czytała się jak geometria, a nie jak obszar widzenia; gracz chciał lekkiej mgiełki zamiast obrysu.
- **Opis:** Opis dotyczy pierwotnej wersji; od GRA-050 mgła zasięgu jest częścią mgły wojny i korzysta z kafelka `assets/map/ai/fog_of_war_tile.svg`. Nowy `client/src/view/visionFog.ts` generuje powtarzalny wzór mgły (periodyczny szum, jasnoniebieska barwa, alpha 10–32%) na osobnej kanwie 192 px. `CanvasTexture` jest dopasowywana do prostokąta otaczającego kafle zasięgu, a `Image` z originem `(0, 0)` leży na głębokości 1 — nad terenem (0), pod jednostkami (2) — więc nie zasłania tokenów. Przy każdej zmianie wyboru mgła jest rysowana od nowa: pomocnicza kanwa przycina się do sumy heksów zasięgu ścieżkami Canvas 2D, wypełnia wzorem przesuniętym o dryf i trafia do tekstury z rozmyciem 3 px. `update()` przesuwa wzór i odświeża teksturę co 120 ms, więc mgła delikatnie dryfuje. `ScenarioScene.drawRangeHints()` pokazuje ją dla wybranej jednostki z skończonym `visionRange`, a ukrywa przy braku wyboru, dla artylerii (`∞`) i po zakończeniu tury. Obrys wzroku i pomocnicze `outlineHexArea()` / `hexBoundaryEdges()` zostały usunięte. Świadomie nie użyto `GeometryMask`, bo w Phaserze 4 działa ona tylko w rendererze Canvas, a gra korzysta z WebGL.
- **Kryteria:**
  - **Wygląd:** zasięg wzroku to półprzezroczysta, chmurna mgiełka na heksach, bez niebieskiej linii i bez wewnętrznych ramek.
  - **Zakres:** mgła pokrywa wyłącznie kafle w zasięgu wybranej jednostki i zmienia się po ruchu, ataku oraz zmianie wyboru.
  - **Warstwy:** mgła jest nad terenem, ale pod tokenami jednostek; nie zasłania jednostek ani obrysów ruchu i strzału.
  - **Widoczność:** mgła pojawia się od razu po wybraniu jednostki i znika przy braku wyboru, dla `visionRange = ∞` oraz po zakończeniu tury.
  - **Wydajność:** jedna tekstura i jeden `Image` na scenę, ponowne malowanie tylko przy zmianie wyboru oraz co 120 ms dryfu.
  - **Dokumentacja:** ADR-031 i INTERF-005 opisują mgłę zasięgu wzroku.

## GRA-049: Ruch w pasku zgodny z rzeczywistymi możliwościami
- **Kontekst:** GRA-047 zerowała prezentowany ruch tylko przy `hasActed`. Jednostka z ułamkowym albo resztkowym `movesLeft`, której żaden sąsiedni kafel nie mieści się w budżecie (np. po drodze została resztka mniejsza niż koszt najtańszego sąsiada), nadal pokazywała w pasku dodatni ruch, choć nie mogła wykonać żadnego kroku. Pasek obiecywał akcję, której `moveTargets()` nie zwraca.
- **Opis:** Czysty moduł `client/src/core/map/movement.ts` dostaje `canMoveNow()`, które łączy warunki `hasActed`, dodatniego `movesLeft` i niepustego `moveTargets()`. `ScenarioCommandBar.refreshUnit()` używa tej funkcji do wyświetlenia `Ruch movesLeft/moveRange`; gdy jednostka nie ma dokąd pójść, pokazuje `Ruch 0/moveRange` i szary kolor, a status zmienia się na „Zablokowana — brak dostępnego ruchu”. Rzeczywisty `movesLeft` pozostaje nietknięty, więc po wejściu na tańszy teren lub po następnej turze jednostka znowu może się ruszyć bez zmiany zapisu.
- **Kryteria:**
  - **Zablokowana:** jednostka z `movesLeft > 0`, ale bez żadnego osiągalnego sąsiada, pokazuje `Ruch 0/...` i nie sugeruje ruchu.
  - **Ułamkowy ruch:** resztka wystarczająca na drogę (koszt 0.5) nadal pozwala na ruch i pokazuje rzeczywistą wartość.
  - **Po akcji:** `hasActed` nadal zeruje prezentowany ruch.
  - **Brak wpływu na stan:** zmiana jest prezentacyjna; `movesLeft`, `hasActed`, tury i zapis mapy pozostają bez zmian.
  - **Testy:** `tests/core/map/movement.test.ts` pokrywa jednostkę otoczoną wodą, ułamek ruchu na drodze oraz `hasActed` i zerowy budżet.
  - **Dokumentacja:** INTERF-005 opisuje zachowanie wskaźnika ruchu.

## GRA-050: Mgła wojny z pamięcią odkrytych pól
- **Kontekst:** Mgła z GRA-048 pokrywała kafle w zasięgu wybranej jednostki, a nie obszar poza zasięgiem całej armii. Po odznaczeniu jednostki albo po ataku mgła znikała, więc teren poza wzrokiem był odsłonięty. Gracz potrzebuje stałej osłony i rozróżnienia między terenem już widzianym i nigdy niewidzianym.
- **Opis:** `client/src/core/vision.ts` dostaje `visibleTileKeys(state, viewer)`, które sumuje `visionTiles()` wszystkich jednostek strony i dołącza ich własne heksy. `ScenarioScene` prowadzi `Map<FactionId, Set<string>>` odkrytych pól: klucze z bieżącego widzenia trafiają do zbioru strony i zostają do końca scenariusza. `view/visionFog.ts` rysuje jedną teksturę na `mapPixelBounds`: bieżąco widoczne heksy są przezroczyste, odkryte wcześniej dostają kafelek `assets/map/ai/fog_of_war_tile.svg` przycięty do heksu i obracany o wielokrotność 60°, a nigdy niewidziane — nieprzezroczyste ciemne tło. Kafelek mgły ma tę samą geometrię co kafle terenu, więc pokrywa je bez szczelin. Nakładka odświeża się po ruchu, ataku i zmianie tury. Pamięć jest per strona, więc w hot-seacie strony nie dzielą odkryć; nie trafia do `GameState` ani SQLite. Gdy własna artyleria widzi całą mapę, mgła znika.
- **Kryteria:**
  - **Obszar:** mgła pokrywa wszystkie kafle poza sumą zasięgów wzroku własnych jednostek, niezależnie od wyboru.
  - **Stany:** bieżąco widziane — odsłonięte; odkryte wcześniej — jaśniejsza mgła; nigdy niewidziane — czarny kafel.
  - **Pamięć:** odkryte pola zostają widoczne po odejściu jednostki, po ataku i po zmianie tury; pamięć jest osobna dla niebieskich i czerwonych.
  - **Bez mgły:** mapa z `fogOfWar = false` nie dostaje nakładki.
  - **Pełny wzrok:** artyleria odsłania całą mapę i ukrywa mgłę.
  - **Warstwy:** mgła leży nad terenem i pod tokenami jednostek; nie zasłania własnych jednostek.
  - **Wydajność:** jedna tekstura i jedno `Image` na scenę; przemalowanie zależy wyłącznie od zmiany widoczności, a nie od liczby klatek.
  - **Testy:** `tests/core/vision.test.ts` pokrywa sumę zasięgów wielu jednostek, dołączenie ich pozycji i pełny zasięg artylerii.
  - **Dokumentacja:** ZAL-007, ADR-034, INTERF-005 i `Mapy.md` opisują pamięć odkrytych pól.
