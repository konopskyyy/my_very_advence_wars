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
- **Kryteria:** Istnieje `core/units.ts`, jednostki można stawiać w edytorze map (GRA-012), typy pokrywają się ze specyfikacją.

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
  - **Logika:** `core/state.ts` udostępnia `getMovePath()` (najtańsza trasa), `moveTargets()` (wszystkie heksy osiągalne w budżecie) i `moveUnit()`, który odejmuje koszt trasy i ustawia `hasActed` tylko przy zerowym ruchu.
  - **Teren i kolizje:** trasa omija wodę i teren nieprzechodni, nie wchodzi na zajęte heksy i nie przekracza `movesLeft`; droga jest tańsza, las, bagno i góry droższe.
  - **Interfejs:** dozwolone heksy są zielone, trasa żółta, a pasek pokazuje instrukcję „1. klik — trasa · 2. klik — potwierdzenie ruchu”; zmiana wyboru i koniec tury czyszczą trasę.
  - **Animacja:** token przesuwa się po kolejnych heksach trasy, a `UnitLayer.setUnits(units, false)` nie nadpisuje jej skokiem do celu.
  - **Testy:** `tests/core/state.test.ts` pokrywa koszt terenu, zasięg, zajęte heksy, wodę, koniec ruchu i wybór tańszej trasy zamiast krótszej.

## GRA-031: Kafelki terenu SVG z wariantami
- **Kontekst:** Autorskie kafelki SVG leżały w katalogu builda (`client/dist/assets/map/`), przez co ginęły przy `npm run build`. Część terenów ma dwa warianty tego samego kafla, a mapa nadal rysowała jednolite heksy.
- **Opis:** Pliki przeniesione do `client/src/assets/map/` i nazwane `<TerrainId>-<wariant>.svg`. `view/terrainTiles.ts` ładuje je przez Vite i wybiera losowy wariant, a `HexMapView` podmienia teksturę przy tworzeniu i zmianie terenu (ADR-028). Tereny bez SVG zachowują proceduralny heks.
- **Kryteria:**
  - **Nazwy:** pliki odpowiadają ID terenu (`plain`, `water`, `city`) i numerowi wariantu; duplikat `city_tile_2_1.svg` nie jest używany.
  - **Warianty:** funkcja `pickVariantIndex(count, random)` w `core/terrain.ts` zwraca indeks z zakresu `0..count-1`, a `tests/core/terrain.test.ts` pokrywa brak wariantów i granice losowania.
  - **Widok:** łąka, woda i miasto używają SVG w edytorze, menu, podglądach i scenariuszu; las, góry, bagno i droga wyglądają jak wcześniej.
  - **Styk kafli:** rysunek wypełnia cały heks (bez ciemnego bevelu), a sprite zachodzi o 3% na sąsiadów, więc między kaflami nie prześwituje czarne tło.
  - **Paleta edytora:** podglądy terenu zachowują rozmiar heksa (~20 px), mimo że tekstura SVG ma 256 px; wybór kafelka skaluje je względem zapisanej skali bazowej, a nie przez `setScale(1)`.
  - **Build:** `npm run build` kopiuje SVG do `client/dist/assets`, więc kafelki działają po przebudowie i w Electronie. `assetsInlineLimit: 0` w `vite.config.ts` blokuje inline'owanie małych SVG, którego Phaser nie potrafi odczytać.

## GRA-032: Pusta lista w menu map
- **Kontekst:** `MapMenuScene.buildList()` zaczynał się od `this.scene.isActive()`. W Phaserze 4 podczas `create()` scena ma status `CREATING`, a nie `RUNNING`, więc warunek był zawsze fałszywy i lista map — razem z kartą „Nowa mapa” — nigdy się nie budowała.
- **Opis:** Usunięty strażnik na początku `buildList()`; karta nowej mapy dodaje się od razu, a strażnik po `await` nadal chroni przed dopisywaniem wierszy do zamkniętej sceny.
- **Kryteria:** Menu map pokazuje kartę „Nowa mapa” i zapisane mapy; wyjście z menu w trakcie ładowania nie dopisuje wierszy do nieistniejącej listy.

## INFRA-002: Testy jednostkowe i mutacyjne w CI
- **Kontekst:** Pipeline `.github/workflows/ci.yml` sprawdzał wyłącznie typy klienta, a Vitest uruchamiał się tylko lokalnie przez `make test`. Testów mutacyjnych nie było, więc jakość asercji nie była mierzona.
- **Opis:** CI ma trzy równoległe joby: typy, testy jednostkowe (`npm test`) i testy mutacyjne (`npm run mutation`). Mutacje liczy Stryker dla `client/src/core/**/*.ts`, a raport HTML/JSON trafia do artefaktu `mutation-report`.
- **Kryteria:**
  - **Testy jednostkowe:** job `Testy jednostkowe` uruchamia `npm test` po `npm ci` i obala pipeline przy czerwonym Vitest.
  - **Mutacje:** konfiguracja w `client/stryker.config.mjs` (runner `vitest`, zakres `src/core`), progi `high 80` / `low 60` / `break 50`; wynik poniżej progu obala job.
  - **Raport:** `client/reports/` jest ignorowany przez git, a w CI publikowany jako artefakt także przy nieudanym jobie.
  - **Lokalnie:** `make mutation` i `npm run mutation` dają ten sam wynik co CI.
  - **Dokumentacja:** `specification/Infrastruktura.md` opisuje zakres, progi i artefakt pipeline'u.
