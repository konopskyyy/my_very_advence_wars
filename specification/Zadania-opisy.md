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
- **Opis:** Pliki przeniesione do `client/src/assets/map/` i nazwane `<TerrainId>-<wariant>.svg`. `view/terrainTiles.ts` ładuje je przez Vite i wybiera losowy wariant, a `HexMapView` podmienia teksturę przy tworzeniu i zmianie terenu (ADR-028). Tereny bez SVG zachowują proceduralny heks.
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
- **Opis:** Pliki przeniesione do `client/src/assets/map/` pod nazwy `<TerrainId>-<wariant>.svg`, stare grafiki zastąpione nowymi. `view/terrainTiles.ts` dostaje dwa warianty lasu i miasta (ADR-028).
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
