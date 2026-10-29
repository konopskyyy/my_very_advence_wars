# Architektura decyzji (ADR)

## ADR-001: Oddzielenie logiki gry od silnika
- **Status:** Zaakceptowany
- **Kontekst:** Logika rozgrywki musi być testowalna bez Phasera.
- **Decyzja:** Cała czysta logika trafi do `client/src/core/`. `client/src/view/` i `client/src/scenes/` korzystają z Phasera.
- **Konsekwencje:** Łatwiejsze testy jednostkowe, mniejsza zależność od silnika, czytelniejsza struktura.

## ADR-002: Komunikacja klient–serwer JSON/REST
- **Status:** Zaakceptowany
- **Kontekst:** Potrzebna synchroniczna wymiana danych między frontendem a backendem Symfony.
- **Decyzja:** Używamy REST z JSON-em, komendy w `client/src/api/` (docelowo), backend udostępnia API pod `http://localhost:18080`.
- **Konsekwencje:** Prosta integracja, łatwa rozbudowa o kolejne endpointy.

## ADR-003: Model jednostek jako dane
- **Status:** Zaakceptowany
- **Kontekst:** Chcemy mieć przewidywalny, testowalny model jednostek bez skomplikowanej hierarchii klas.
- **Decyzja:** Jednostka reprezentowana jako `Unit` — dyskryminowana unia (`kind`). Definicje (`UNIT_DEFS`, `FACTION_DEFS`) są tabelami danych. Stan gry w `GameState` (mapa + jednostki + licznik). Operacje na stanie (`placeUnit`, `removeUnitAt`, `findUnitAt`, `clearUnits`) to czyste funkcje. Obiektowość (Phaser) zostawiamy wyłącznie dla warstwy widoku.
- **Konsekwencje:** Łatwa serializacja, łatwe testy, czytelne reguły, zgodne z zasadą „logika gry w `core/`”.

## ADR-004: Siatka heksagonalna
- **Status:** Zaakceptowany
- **Kontekst:** Gra operuje na polu bitwy w układzie heksagonalnym. Potrzebna spójna reprezentacja dla mapy, edytora i rozgrywki.
- **Decyzja:** Używamy heksów o układzie **pointy-top**. Cała matematyka siatki (konwersje offset ↔ axial ↔ podwojona, piksel ↔ hex, narożniki heksa, odległość, sąsiedztwo) jest w jednym pliku: `client/src/core/map/layout.ts`. Warstwa widoku nie liczy pozycji heksów samodzielnie — bierze je z tego modułu. Edytor maluje **teren** i stawia **jednostki** jako osobną warstwę (ADR-011). Pozycja jednostek w modelu wyrażana jest w koordynatach heksagonalnych.
- **Układy współrzędnych i ich wzory:**
  - **offset odd-r `(col,row)`** — w nim trzymana jest mapa (ADR-005). `col` liczy heksy w danym wierszu, a parzystość bezwzględnego `row` przesuwa wiersze nieparzyste o pół heksa w prawo.
  - **axial `(q,r)`** — wewnętrzna postać heksa, obliczana z offsetu: `q = col − (row − (row & 1)) / 2`, `r = row`; w drugą stronę `col = q + (r − (r & 1)) / 2`, `row = r`.
  - **podwojona `(2q + r, r)`** — konwencja odczytu w HUD-zie edytora: `kolumna = 2q + r = 2·col + (row & 1)`, `wiersz = r`. Kolumna jest poziomą pozycją heksa w półheksach, więc sąsiednie hexy w wierszu różnią się o 2, a parzystość kolumny zdradza parzystość wiersza (wiersze nieparzyste leżą o pół heksa dalej). Numer jest wspólny dla całej mapy — nie resetuje się co wiersz jak `col` w offsecie.
- **Konsekwencje:** Spójność między modelem a rysowaniem, łatwa droga do ścieżek/zasiegu ruchu. Jeden plik z matematyką = jedno miejsce do zmiany układu siatki. Offset w modelu i podwojona kolumna w HUD-zie to dwa różne liczenia nad tym samym heksem — świadomie, bo tylko odczyt ma być jednoznaczny dla gracza.

## ADR-005: Model mapy jako zbiór komórek
- **Status:** Zaakceptowany
- **Kontekst:** W edytorze trzeba dorzucać kafelki **poza mapą, na czarnym tle**, a mapa ma swobodnie rosnąć w każdą stronę. Prostokątna siatka wymuszałaby przesuwanie istniejących heksów przy każdym powiększeniu (i zmianę parzystości wierszy w układzie odd-r).
- **Decyzja:** `GameMap` to zbiór komórek `Record<"col,row", TerrainId>` o **absolutnych** współrzędnych. Brak komórki = brak heksa = czarne tło. Operacje: `createMap`, `terrainAt`, `setTerrain`, `removeTerrain` (usuwa kafelek), `fillMap`, `clearMap`, `mapBounds`, `mapPixelBounds`, `mapDoubledBounds` (zasięg w kolumnach podwojonych, na potrzeby odczytu w HUD-zie). Model mieszka w `client/src/core/map/model.ts`. Parzystość wiersza liczona jest z bezwzględnego `row`, więc dodanie heksa nigdy nie przesuwa istniejących.
- **Konsekwencje:** Malowanie poza mapą i usuwanie kafelków działają bez przesuwania mapy; model jest gotowy do serializacji (JSON). Koszt: render iteruje po komórkach, a nie po prostokącie.

## ADR-006: Moduł mapy i granica z warstwą widoku
- **Status:** Zaakceptowany
- **Kontekst:** Kod mapy rozproszono po `core/hex.ts`, `core/map.ts`, `core/mapGenerator.ts`, `core/maps.ts` i `view/hexGrid.ts` — część czystej matematyki (zasięg mapy w pikselach) leżała w warstwie widoku, a dokumentacja opisywała inny układ plików.
- **Decyzja:** Mapa ma własny moduł `client/src/core/map/`: `layout.ts` (algorytm siatki heksagonalnej), `model.ts` (model i operacje), `generator.ts` (`generateMap`, `extendMap`, `paintRect`), `catalog.ts` (mapy wbudowane) i `index.ts` (publiczne API modułu). Warstwa widoku rysuje, ale nie wylicza: `HexMapView` pozycjonuje heksy wprost z `layout.ts`, a przesunięcie podglądu w menu map jest wyłącznie kwestią prezentacji (`view/mapPreview.ts`) i nie dotyka modelu.
- **Konsekwencje:** Jedno miejsce na geometrię heksów i jedno na model mapy; testy logiki mapy leżą w lustrzanym `tests/core/map/` (ADR-008); podgląd nie może już „przesunąć" modelu.

## ADR-007: Narzędzia deweloperskie tylko na żądanie
- **Status:** Zastąpiony tymczasowo przez ADR-014
- **Kontekst:** Pasek FPS w edytorze jest pomocny przy pracy nad generatorem, ale przy zwykłym uruchomieniu gry jest tylko szumem w interfejsie — a użytkownik nie powinien trafiać na klawisz, którego efekt zależy od trybu uruchomienia.
- **Decyzja:** Narzędzia deweloperskie nie powstają, dopóki nie zostaną jawnie włączone parametrem `?dev=1` w adresie (`client/src/devTools.ts`). W edytorze działa wtedy własny dev bar (`client/src/view/devBar.ts`) z FPS, czasem klatki, liczbą kafli, czasem CPU poświęconym na operacje na bieżącej mapie i rozmiarem modelu mapy w pamięci. Pomiary są czystą logiką (`client/src/core/map/metrics.ts`), więc da się je przetestować bez silnika.
- **Konsekwencje:** Gra startuje czysto, a diagnostyka jest dostępna na wyraźne życzenie (`http://localhost:18573/?dev=1`). HUD nie pokazuje skrótów, które nic nie robią.

## ADR-008: Testy poza `src/`, w lustrzanym drzewie
- **Status:** Zaakceptowany
- **Kontekst:** Testy leżały obok modułów w `client/src/`, więc katalog kodu produkcyjnego mieszał się z testowym, a granica „kod vs testy” była widoczna tylko po nazwie pliku. Chcieliśmy jednym spojrzeniem oddzielić jedno od drugiego, nie tracąc powiązania testu z modułem.
- **Decyzja:** Testy leżą w `client/tests/`, a drzewo katalogów jest lustrem `client/src/`: moduł `src/core/map/model.ts` ma test `tests/core/map/model.test.ts` (ta sama nazwa plus `.test.ts`). Importy w testach są względne (`../../../src/...`), bez aliasów. Reguły pilnuje `tests/structure.test.ts`: każdy plik testowy musi mieć odpowiednik w `src/`, a w `src/` nie może być plików `*.test.ts`. Szczegóły i przykłady: [[Konwencje]].
- **Konsekwencje:** `src/` zawiera wyłącznie kod produkcyjny, a dodanie testu sprowadza się do odtworzenia ścieżki w `tests/`. Vitest ma zawężony `test.include` i nie zbiera przypadkowych plików, a `tsc --noEmit` sprawdza również testy. Koszt: dłuższe ścieżki importów i obowiązek utrzymania lustra — wymusza go test struktury.

## ADR-009: CI sprawdza typy TypeScript
- **Status:** Zaakceptowany
- **Kontekst:** Błąd typu w kliencie wychodził dopiero przy lokalnym buildzie. Pull requesty nie miały wspólnego, powtarzalnego checku, więc każdy weryfikował typy po swojemu.
- **Decyzja:** GitHub Actions uruchamia `.github/workflows/ci.yml` przy pushu na `master`, przy pull requeście i ręcznie (`workflow_dispatch`). Pipeline używa Node 22, instaluje zależności przez `npm ci` i uruchamia `npx tsc --noEmit` w `client/`. Zakres to wyłącznie typy — bez Vitest, bez `vite build` i bez Dockera.
- **Konsekwencje:** Szybki feedback bez sekretów i bez budowania obrazów. Testy i build pozostają poza CI do czasu osobnej decyzji; lokalnie odpowiadają im `make test` i `npm run build`. Stan pipeline'u opisuje [[Infrastruktura]].

## ADR-010: Rzeczownikowy opis commitów
- **Status:** Zaakceptowany
- **Kontekst:** Dotychczasowe commity opisywały czynność w trybie rozkazującym („wydziel testy klienta do tests/”), więc historia czytała się jak lista poleceń dla wykonawcy, a nie zapis tego, co już się stało. Typ conventional (`feat:`, `fix:`, `chore:`) zostaje, ale sam opis nie mówił, jaki był efekt zmiany.
- **Decyzja:** Po typie commit opisuje **wykonaną zmianę** rzeczownikowo, nie w trybie rozkazującym. Przykład: `chore: wydzielenie testów klienta do tests/ z lustrzanym drzewem` zamiast `chore: wydziel testy klienta do tests/ z lustrzanym drzewem`. Zasada dotyczy całej treści commita, także dłuższych opisów.
- **Konsekwencje:** Historia commitów czyta się jako opis stanu po zmianie i nie sugeruje, że coś dopiero ma zostać zrobione. Świadomie odchodzimy od imperative mood z Conventional Commits; wymaga to przepisania przyzwyczajenia przy każdym commicie.

## ADR-011: Jednostki jako warstwa edytora map
- **Status:** Zaakceptowany
- **Kontekst:** Model jednostek istnieje od ADR-003, ale edytor operował wyłącznie na `GameMap`, a ADR-004 wprost wykluczał stawianie jednostek. Do budowy map potrzeba jednak rozstawiania piechoty, czołgów, artylerii i zwiadu na kafelkach.
- **Decyzja:** Edytor trzyma cały `GameState` (mapa + jednostki + licznik), a nie samą mapę. Jednostki są rysowane jako osobna warstwa nad terenem (`client/src/view/unitLayer.ts`), a operacje pochodzą z czystego `client/src/core/state.ts` (`placeUnit`, `removeUnitAt`, `clearUnits`). Token jednostki to koło w kolorze strony z ikoną rodzaju (żołnierz, czołg, działo, zwiad) rysowaną na canvasie — bez liter, żeby rodzaj był czytelny na mapie. Jednostkę można postawić tylko na istniejącym kafelku; na jednym heksie stoi najwyżej jedna jednostka (postawienie zastępuje poprzednią). Tryb i rodzaj wybiera się kliknięciem kafelka w lewym menu (ADR-012), LPM stawia, a PPM usuwa. Szkic mapy w `registry` przechowuje cały `GameState`, więc jednostki wracają po powrocie z menu map.
- **Konsekwencje:** Edytor i przyszła rozgrywka korzystają z tego samego modelu stanu. Usunięcie kafelka usuwa stojącą na nim jednostkę, a czyszczenie mapy czyści też jednostki. Podgląd w menu map nadal pokazuje sam teren. Zapis mapy (GRA-003) musi objąć jednostki, inaczej rozstawienie zginie przy pierwszym zapisie do pliku/API.

## ADR-012: Wybór narzędzi kliknięciem w menu edytora
- **Status:** Zaakceptowany
- **Kontekst:** Wybór terenu i jednostki klawiszami `1`–`7`/`1`–`4` oraz `U` był niewidoczny dla nowego użytkownika, a skróty mieszały się z klawiszami kamery. W edytorze potrzebny jest czytelny panel z podglądem dostępnych narzędzi.
- **Decyzja:** Lewy panel edytora zawiera kafelki terenu, kafelki jednostek i przyciski strony (niebieska/czerwona). Kliknięcie kafelka ustawia tryb i narzędzie, a wybór jest wyróżniony obwódką; kafelek pod kursorem reaguje na hover. Klawiatura obsługuje wyłącznie kamerę, czyszczenie mapy, rozszerzanie krawędzi, narzędzia deweloperskie i wyjście — nie wybór narzędzi.
- **Konsekwencje:** Wszystkie tereny i jednostki są widoczne bez zgadywania skrótów, a wybór jest jednoznaczny. Panel jest przyklejony do lewej krawędzi ekranu i ma skrócony HUD, żeby zostawić więcej miejsca na mapę i zmieścić się w pionie.

## ADR-013: Menu map jako wejście do edytora
- **Status:** Zaakceptowany
- **Kontekst:** Menu główne miało dwa wejścia do edycji: „Edytor map” od razu uruchamiał nową mapę, a „Mapy” otwierało listę. Wyjście z edytora prowadziło do listy, więc wejście i wyjście kończyły się w różnych miejscach. Użytkownik nie miał szansy wybrać mapy przed rozpoczęciem pracy.
- **Decyzja:** „Edytor map” w menu głównym otwiera menu map. Menu map zawiera „Nową mapę” oraz listę map wbudowanych i ich szkiców. Osobny wpis „Mapy” znika, żeby nie duplikować tej samej ścieżki. `ESC` w edytorze wraca do menu map, a `ESC` w menu map — do menu głównego.
- **Konsekwencje:** Wejście i wyjście z edytora prowadzą przez to samo miejsce, a wybór mapy jest zawsze świadomy. Nowa mapa wymaga jednego kliknięcia więcej, ale nie miesza się z listą istniejących map.

## ADR-014: Tymczasowo zawsze widoczny pasek dev
- **Status:** Zaakceptowany
- **Kontekst:** Podczas prac nad edytorem i diagnostyką mapy potrzebny jest stały wgląd w FPS, czas klatki, CPU i pamięć. Próg `?dev=1` z ADR-007 wymagał pamiętania o parametrze przy każdym uruchomieniu.
- **Decyzja:** Na czas prac pasek dev powstaje i jest widoczny od razu w lewym panelu edytora (menu budowania mapy), bez `?dev=1`. Klawisz `F` nie ukrywa paska. Po zakończeniu prac widoczność wróci na żądanie zgodnie z ADR-007.
- **Konsekwencje:** Diagnostyka jest zawsze pod ręką, ale interfejs jest bardziej zajęty. To świadomie tymczasowe odstępstwo; zakres pomiarów i docelowa zasada ADR-007 pozostają bez zmian. Okno DevTools Electrona nadal wymaga `ELECTRON_DEVTOOLS=1`.

## ADR-015: Wewnętrzna rozdzielczość 16:9
- **Status:** Zaakceptowany
- **Kontekst:** Scena 640×480 (4:3) na monitorze 16:9 była skalowana do wysokości, zostawiając czarne pasy po bokach. Użytkownik chce wykorzystać ekran także w poziomie.
- **Decyzja:** Wewnętrzna rozdzielczość gry to 1280×720 (16:9), a Phaser nadal skaluje ją przez `Scale.FIT` z centrowaniem. Nie rozciągamy obrazu i nie zmieniamy logiki mapy; rosną tylko współrzędne sceny.
- **Konsekwencje:** Na monitorach 16:9 gra wypełnia cały ekran bez zniekształceń. Na innych proporcjach (16:10, 21:9) pozostają pasy, bo proporcje są zachowane. UI edytora ma więcej miejsca w pionie, więc pasek dev mieści się w lewym panelu.

## ADR-016: Scenariusze jako poligon testowy
- **Status:** Zaakceptowany
- **Kontekst:** Do tej pory dało się oglądać mapę tylko w edytorze, więc nie było miejsca na sprawdzanie gry na gotowym terenie z jednostkami obu stron. Potrzebny jest osobny, powtarzalny scenariusz testowy, niezależny od szkiców edytora.
- **Decyzja:** Menu główne ma wpis „Scenariusze”, który otwiera listę scenariuszy. Dane scenariusza to `ScenarioDefinition` w `client/src/core/scenario.ts`: identyfikator, nazwa, opis i pełny `GameState` (mapa + jednostki). Katalog jest czystą logiką bez Phasera, a scena `ScenarioScene` tylko go rysuje i obsługuje kamerę, podgląd heksa i wybór jednostki. Pierwszy scenariusz „Front Wschodni” ma mapę 48×28 (1344 kafle) z wszystkimi rodzajami terenu i po 10 jednostek każdej strony. Zapisane mapy z SQLite są pokazywane jako dodatkowe scenariusze testowe.
- **Konsekwencje:** Scenariusze są testowalne w `tests/core/scenario.test.ts` bez uruchamiania gry, a mechanika tur, armii i ruchu ma jedno miejsce rozwoju (`core/turn.ts`, `core/scenario.ts`, `core/state.ts`). Od GRA-027 scena prowadzi naprzemienne tury i ruch jednostek (ADR-020), a od GRA-030 ruch po trasie z kosztem terenu (ADR-027); walka i SI pozostają osobnym zadaniem.

## ADR-017: Wewnętrzna baza map w SQLite (sql.js)
- **Status:** Zaakceptowany
- **Kontekst:** Edytor tworzy teren i jednostki, ale po zamknięciu sceny lub przeładowaniu strony szkic znikał. Backend Symfony ma MySQL na potrzeby przyszłej rozgrywki sieciowej, ale zapis mapy w tej fazie nie powinien wymagać działającego serwera — gra ma działać także w Electronie i w przeglądarce bez backendu. Potrzebna jest lekka, lokalna baza.
- **Decyzja:** Wewnętrzna baza to SQLite uruchamiany w kliencie przez `sql.js` (WASM). Plik bazy jest trzymany w `localStorage` pod kluczem `mvaw:sqlite`, a schemat tworzy `MAPS_SCHEMA` w `client/src/storage/maps.ts` (`CREATE TABLE IF NOT EXISTS`). Tabela `maps` przechowuje metadane, liczniki i cały `GameState` jako JSON; zapis tego samego `id` robi upsert. Mapy startowe (`dolina`, `wzgórza`, `front-wschodni`) dosiewa `seedBuiltInMaps()` przy otwarciu bazy. Warstwy: `storage/database.ts` (inicjalizacja i trwałość), `storage/mapSerialization.ts` (walidacja JSON) i `storage/maps.ts` (schemat, seed i operacje). Backend i MySQL pozostają bez zmian. Szczegóły formatu, schematu i diagnostyki: [[Mapy]].
- **Konsekwencje:** Mapy przeżywają przeładowanie i są wspólne dla scen w obrębie tego samego originu i profilu (przeglądarka lub Electron), ale nie między przeglądarką a Electronem. Nie ma synchronizacji między urządzeniami — to świadomie lokalny magazyn. Limit `localStorage` (około 5 MB) wystarcza na dziesiątki map, ale duże mapy trzeba będzie przenieść do IndexedDB lub API razem z GRA-003. `sql.js` dodaje do builda plik WASM (~685 kB) i wymaga asynchronicznego otwarcia bazy, więc menu i zapis obsługują `Promise`. Schemat nie jest jeszcze wersjonowany — zmiana kolumn wymaga migracji z GRA-026, a uszkodzony plik bazy jest odrzucany i zastępowany nową bazą. Zapis mapy wbudowanej zachowuje jej `id`, więc aktualizuje wpis z seeda zamiast tworzyć duplikat.

## ADR-018: Wspólny widok mapy i przewijane listy
- **Status:** Zaakceptowany
- **Kontekst:** `MapEditorScene` i `ScenarioScene` niezależnie liczyły granice kamery, zoom, przeciąganie i tłumaczenie kursora na heks. Menu map i menu scenariuszy powielały budowę kart z miniaturą, a przy większej liczbie zapisanych map zawartość wychodziła poza ekran 720 px — bez możliwości przewinięcia. Każda poprawka tych elementów wymagała zmian w kilku miejscach.
- **Decyzja:** Wspólne elementy widoku mapy trafiają do `client/src/view/`: `mapViewport.ts` (kamera, zoom, przeciąganie, przewijanie krawędzią ekranu, granice mapy, kursor → heks), `mapCard.ts` (karta mapy lub scenariusza z miniaturą i metadanymi) oraz `scrollList.ts` (lista ograniczona nakładkami, przewijana kółkiem myszy, z paskiem pozycji). Czyste operacje pozostają w `core/`: `mapTileCount` w `core/map/model.ts` oraz `deployUnits` i `countUnits` w `core/state.ts`. Sceny i menu korzystają z tych modułów zamiast własnych kopii. Próg decyzji: matematyka mapy i stan w `core/` bez Phasera (ADR-001), a wszystko, co tworzy obiekty Phasera, w `view/`.
- **Konsekwencje:** Zmiana zachowania kamery, wyglądu karty lub sposobu przewijania odbywa się w jednym pliku. Listy map i scenariuszy pokazują wszystkie wpisy, a nadmiar przewija się kółkiem myszy; pasek po prawej pokazuje pozycję. Widok nadal zależy od Phasera, więc nie ma dla niego testów jednostkowych — testowane są tylko nowe funkcje `core/`.

## ADR-019: Seed map przy otwarciu bazy
- **Status:** Zaakceptowany
- **Kontekst:** Mapy wbudowane i scenariusz `front-wschodni` istniały tylko w kodzie, więc nie były edytowalne w edytorze map. Użytkownik chciał jedno źródło prawdy: każda mapa widoczna w menu scenariuszy ma mieć swój wpis w SQLite. Wersjonowany runner migracji (GRA-026) nie został zaimplementowany, a schemat nie wymagał jeszcze zmiany kolumn.
- **Decyzja:** `seedBuiltInMaps()` w `client/src/storage/maps.ts` przy każdym otwarciu bazy wstawia brakujące wpisy dla `BUILT_IN_MAPS` (`dolina`, `wzgórza`) i `BUILT_IN_SCENARIOS` (`front-wschodni`) przez `INSERT ... ON CONFLICT(id) DO NOTHING`. Stan map wbudowanych bierze się z `core/map/catalog.ts`, a scenariusza z `core/scenario.ts`. Gdy seed coś wstawi, `openMapDatabase()` od razu utrwala bazę w `localStorage`. Schemat nadal tworzy `CREATE TABLE IF NOT EXISTS` (`MAPS_SCHEMA`); nie ma tabeli `schema_migrations`, kolumny `source` ani pliku `seed/maps.json`.
- **Konsekwencje:** Świeża baza od razu zawiera wszystkie mapy startowe, więc menu scenariuszy i edytor map czytają ten sam zbiór wierszy. Seed jest idempotentny i nie nadpisuje zapisanych wersji, bo działa tylko dla brakujących `id`. Dodanie nowej mapy startowej wymaga wpisu w katalogu/scenariuszach; zostanie dosiana przy następnym otwarciu. Usunięty wiersz wróci przy kolejnym otwarciu bazy, bo seed znów go wstawi. Zmiana kolumn nadal wymaga migracji z GRA-026; do tego czasu schemat jest tworzony bez wersjonowania.

## ADR-020: Tury naprzemienne w scenariuszu
- **Status:** Zaakceptowany
- **Kontekst:** Scenariusz pozwalał tylko oglądać mapę i wybierać jednostki (ADR-016), więc obie strony były widoczne naraz i nie było pojęcia aktywnej strony. Pierwszym krokiem do rozgrywki jest podział na tury, przy czym na razie obie strony gra człowiek na jednym PC (hot-seat).
- **Decyzja:** Stan tury to `TurnState` w `client/src/core/turn.ts` — aktywna strona i numer tury. Nowa gra startuje od `blue`, a `nextTurn()` przełącza strony w kolejności `TURN_ORDER` (`blue → red → blue`) i zwiększa numer. `beginTurn()` przywraca jednostkom aktywnej strony `movesLeft` z `UNIT_DEFS` i czyści `hasActed`; jednostki drugiej strony zostają bez zmian. `ScenarioScene` trzyma `TurnState` w polu sesji, ma przycisk „ZAKOŃCZ TURĘ” i skrót `T`. Tura nie wchodzi do `GameState`, bo ten opisuje zapisywaną mapę, a nie przebieg sesji — dzięki temu format SQLite i seed zostają bez zmian.
- **Konsekwencje:** Tura zaczyna się od nowa przy każdym wejściu do scenariusza, a zapisana mapa nie pamięta stanu tury. Ruch jednostek, walka i ewentualna SI mogą budować na `beginTurn()` i aktywnej stronie bez zmiany schematu bazy. Gdyby tura miała przeżywać zamknięcie scenariusza, trzeba będzie rozszerzyć `GameState` i dodać migrację.

## ADR-021: Wojsko obu stron na mapach scenariuszy
- **Status:** Zaakceptowany
- **Kontekst:** Menu scenariuszy pokazuje także mapy zapisane w edytorze (ADR-016, ADR-017). Takie mapy często mają tylko teren albo jednostki jednej strony, więc otwarcie ich jako scenariusza nie dawało rozgrywki z przeciwnikiem. Ręczne dopisywanie wojska do każdej mapy w edytorze byłoby powtarzalne i nadpisywało intencję autora mapy.
- **Decyzja:** `ensureScenarioArmies()` w `client/src/core/scenario.ts` uzupełnia wojsko tylko stronie, która nie ma żadnej jednostki. Jednostki trafiają na wolne, przechodnie kafle wzdłuż wysokości mapy — niebieskie od lewej, czerwone od prawej krawędzi. Scenariusze z jednostkami obu stron pozostają bez zmian. Uzupełnienie dzieje się przy budowie scenariusza w menu i w `ScenarioScene`, więc jest stanem sesji; do SQLite nadal trafia wyłącznie stan z edytora.
- **Konsekwencje:** Każda mapa z edytora jest od razu grywalnym poligonem z obiema stronami, także bez jednostek postawionych ręcznie. Zmiana zasad rozstawiania wojska jest w jednej funkcji `core/` i nie wymaga migracji bazy. Koszt: menu scenariuszy pokazuje wojsko, którego nie ma w zapisanej mapie, więc liczby na karcie mogą różnić się od liczb w edytorze; to celowe, bo karta opisuje scenariusz, a nie zapis edytora.

## ADR-022: Ruch jednostek o jedno pole
- **Status:** Zastąpiony przez ADR-027
- **Kontekst:** Tury naprzemienne (ADR-020) dawały pojęcie aktywnej strony, ale jednostki nie zmieniały pozycji, więc scenariusz nadal był tylko podglądem. Pełny ruch po kosztach terenu i pathfinding to większa mechanika; pierwszy krok ma być prosty i przewidywalny.
- **Decyzja:** Jednostka aktywnej strony wykonuje jeden ruch na turę na sąsiedni heks. Reguły są czystymi funkcjami w `client/src/core/state.ts`: `canMoveUnit()` sprawdza sąsiedztwo, `movesLeft`, `hasActed`, zajętość celu i przechodniość terenu, a `moveUnit()` ustawia nową pozycję, `movesLeft = 0` i `hasActed = true`. `moveTargets()` zwraca dozwolone sąsiednie heksy dla podpowiedzi w `ScenarioScene`. Nie ma pathfindingu ani kosztu terenu — ruch zawsze kosztuje jedno pole i jedną akcję.
- **Konsekwencje:** Każda jednostka rusza się najwyżej raz na swoją turę, niezależnie od `moveRange` z `UNIT_DEFS`; pozostałe wartości ruchu zostają na przyszłą mechanikę. Ruch jest testowalny bez Phasera, a podpowiedź i wykonanie korzystają z tej samej funkcji, więc nie rozjadą się. Koszt: jednostki nie omijają przeszkód i nie wykorzystują dróg do szybszego ruchu — to świadomie osobna, późniejsza praca.

## ADR-023: Dwie kamery w scenariuszu — mapa i stały interfejs
- **Status:** Zaakceptowany
- **Kontekst:** `MapViewport` zoomował kamerę główną, a panel, HUD i przyciski były rysowane w tej samej kamerze ze `scrollFactor(0)`. Skutek: przy zmianie zoomu interfejs skalował się razem z mapą, a przy większym powiększeniu przycisk „ZAKOŃCZ TURĘ” wychodził poza ekran i przestawał być klikalny.
- **Decyzja:** Scena scenariusza ma dwie kamery Phasera. Kamera główna (`scenario`) zajmuje się wyłącznie mapą: zoomem, przewijaniem, przeciąganiem, jednostkami, kursorem, obrysem wyboru i podpowiedziami ruchu. Druga kamera (`scenario-ui`) ma stały zoom `1` i zerowe przewinięcie, a renderuje tylko panel, HUD, przyciski i podpisy. Obie kamery wykluczają obiekty drugiej przez `ignore()`, więc nic nie jest rysowane dwa razy. Lista obiektów UI rośnie przez `registerUi()`, a po każdej zmianie jednostek `refreshUnits()` od razu wyklucza nowe tokeny z kamery UI. Panel i jego przyciski pozostają w stałych współrzędnych ekranu, a `pointerOverPanel()` nadal blokuje przewijanie i kliknięcia mapy pod panelem.
- **Konsekwencje:** Zoom zmienia wyłącznie mapę i jej nakładki; rozmiar, położenie i obszar klikalny interfejsu są niezależne od powiększenia. Nowe obiekty świata lub UI trzeba jawnie przypisać do właściwej kamery — pominięcie `registerUi()` albo `ignore()` powoduje dublowanie albo znikanie. Hit-test Phasera wybiera kamerę pod kursorem na podstawie `cameraFilter`, więc przyciski UI trafiają do `scenario-ui`, a heksy do kamery głównej. Podejście jest lokalne dla `ScenarioScene`; edytor map nadal używa jednej kamery, bo jego panel jest rzadziej powiększany i nie zawiera przycisków akcji w rozgrywce.

## ADR-024: Dolny pasek dowodzenia w kamerze interfejsu
- **Status:** Zaakceptowany
- **Kontekst:** Po rozdzieleniu kamer (ADR-023) lewy panel nadal łączył metadane scenariusza, HUD, statystyki wybranej jednostki i przycisk końca tury. Informacje o jednostce były wciśnięte w listę tekstową, a przycisk tury nie miał stałego, wygodnego miejsca przy dolnej krawędzi ekranu. Gracz potrzebował jednego miejsca na najważniejsze akcje i podgląd klikniętej jednostki, bez zasłaniania mapy osobnym panelem w lewym górnym rogu.
- **Decyzja:** Scena scenariusza ma stały dolny pasek dowodzenia o wysokości `BAR_HEIGHT`, rozpięty na całą szerokość ekranu i renderowany przez kamerę `scenario-ui` (ADR-023). Pasek dzieli się na trzy części: po lewej jest podgląd tokenu wybranej jednostki i jej statystyki (HP, atak, obrona, status ruchu), pozycja i teren; w środku nazwa i opis scenariusza, liczniki jednostek i kafli, informacja o heksie pod kursorem oraz skróty „MENU SCENARIUSZY” i „MENU GŁÓWNE”; po prawej przycisk „ZAKOŃCZ TURĘ”, numer tury ze stroną i skróty sterowania. Podgląd używa tej samej tekstury co tokeny na mapie (`unitTexture` z `view/unitLayer.ts`), więc nie ma osobnych zasobów graficznych. Przy braku wyboru pasek pokazuje podpowiedź zamiast tokenu. Dawny lewy panel z HUD-em i nawigacją został usunięty — cała jego treść trafiła do paska. `pointerOverUi()` obejmuje pasek, więc mapa pod nim nie reaguje na kliknięcia ani kółko myszy.
- **Konsekwencje:** Najważniejsza akcja tury i informacje o jednostce są zawsze widoczne w tym samym miejscu, niezależnie od zoomu i przewinięcia mapy. Pasek zasłania dolny fragment mapy, ale jego dolna krawędź (ostatnie 24 px ekranu) pozostaje strefą przewijania — przejechanie na sam dół przewija mapę, natomiast kliknięcia i kółko myszy nad paskiem są zablokowane. Układ paska korzysta z `scale.width`/`scale.height` i stałej wysokości, więc przy zmianie rozdzielczości gry wymaga sprawdzenia. Podgląd jest tylko wizualny (brak testów jednostkowych); testowana pozostaje logika ruchu i tur w `core/`.

## ADR-025: Nazwa mapy edytowana w kanwie gry
- **Status:** Zaakceptowany
- **Kontekst:** Nowa mapa w edytorze zawsze nazywała się `nowa`, a zapis zamieniał ją na `Mapa lokalna`. Użytkownik nie miał sposobu nadania nazwy przed zapisem, więc wszystkie nowe mapy wyglądały w menu tak samo. Gra działa w przeglądarce i w Electronie, gdzie `window.prompt` nie jest niezawodne, a dodanie `<input>` poza kanwą wymagałoby osobnego kontenera DOM i ręcznego skalowania razem z `Scale.FIT`.
- **Decyzja:** Nazwę edytuje się w kanwie, w polu „NAZWA” lewego panelu `MapEditorScene`. Kliknięcie pola włącza tryb edycji: znaki są dopisywane do szkicu, `Backspace` usuwa ostatni znak, `Enter` zatwierdza, a `Esc` anuluje. Na czas edycji skróty edytora i ruch kamery są wyłączone, żeby litery `WASD`, `X` i `Shift` nie malowały mapy ani jej nie rozszerzały. Normalizacja (przycięcie i limit 32 znaków) jest czystą funkcją `normalizeMapName()` w `client/src/core/map/naming.ts`; pusta nazwa wraca do `nowa`, a zapis nowej mapy bez nazwy nadal używa `Mapa lokalna`. Zapis do SQLite korzysta z pola `mapName`, więc nazwa jest widoczna w menu map i scenariuszy.
- **Konsekwencje:** Nazwę można nadać od razu w edytorze, bez zależności od DOM, Electrona i systemowych okien dialogowych. Koszt: brak zaznaczania tekstu, schowka i kursora myszy w polu — edycja jest klawiaturowa, jak w konsoli; długie nazwy są przycinane do 32 znaków. Pole jest elementem panelu, więc nie wpływa na mapę ani na zapis stanu gry. Gdyby w przyszłości potrzebny był pełny edytor tekstu, można przejść na Phaser DOM Element albo osobny formularz zapisu.

## ADR-026: Scenariusz = mapa z SQLite
- **Status:** Zaakceptowany
- **Kontekst:** Menu scenariuszy miało zaszyty katalog `BUILT_IN_SCENARIOS`, a osobno pokazywało zapisane mapy. `Front Wschodni` istniał tylko w kodzie, więc nie dało się go otworzyć w edytorze map — relacja scenariusz–mapa była jednostronna i niepełna. Jednocześnie edytor pokazywał mapy wbudowane obok SQLite, więc ta sama mapa mogła występować w dwóch miejscach.
- **Decyzja:** Scenariusz nie ma własnej tabeli ani katalogu w menu. Każda mapa w tabeli `maps` jest potencjalnym scenariuszem, a menu scenariuszy czyta wyłącznie `listSavedMaps()`. Mapy wbudowane i `front-wschodni` trafiają do SQLite przez `seedBuiltInMaps()` (ADR-019), więc mają swoje edytowalne wiersze. Menu map pokazuje tę samą, jedną listę map z SQLite. Przycisk `EDYTUJ MAPĘ` w panelu scenariusza otwiera mapę w `MapEditorScene` z jej stanem z bazy; zapis aktualizuje ten sam wiersz, a `ESC` wraca do menu scenariuszy. Wojsko brakujące jednej stronie uzupełnia `ensureScenarioArmies()` tylko w sesji (ADR-021).
- **Konsekwencje:** Nie ma „scenariusza bez mapy” ani duplikatów tej samej mapy w edytorze i scenariuszach. Zmiana nazwy, terenu lub jednostek w edytorze jest od razu widoczna w menu scenariuszy. Filtrowanie listy odrzuca mapy mniejsze niż 16 kafli i takie, którym nie da się rozstawić obu stron. Koszt: menu scenariuszy pokazuje wszystkie mapy z bazy, więc porządek zależy od nazw i dat zapisu; nie ma osobnych metadanych scenariusza (np. celu misji), a `front-wschodni` jest zwykłym wierszem, który użytkownik może nadpisać. Gdy pojawią się cele misji i ustawienia niezależne od mapy, trzeba będzie wrócić do osobnej tabeli scenariuszy.

## ADR-027: Ruch po trasie z kosztem terenu
- **Status:** Zaakceptowany
- **Kontekst:** ADR-022 ograniczał ruch do jednego sąsiedniego heksa, więc `moveRange` z `UNIT_DEFS` i koszt terenu z `TERRAIN_DEFS` nie miały zastosowania. Gracz nie widział, ile punktów ruchu zużyje dana trasa, a jedyny klik przesuwał jednostkę bez możliwości sprawdzenia ścieżki. Chcieliśmy wykorzystać istniejące dane terenu i pokazać trasę przed potwierdzeniem, nie wiążąc logiki z Phaserem (ADR-001).
- **Decyzja:** Ruch liczy się po ścieżce w `client/src/core/state.ts`. `getMovePath()` szuka najtańszej trasy po sąsiednich heksach i odrzuca teren nieprzechodni, zajęte heksy oraz ścieżki droższe niż `movesLeft`; relaksacja kosztów trwa do wyczerpania kolejki, więc wynikiem jest trasa minimalna, a nie pierwsza znaleziona. `moveTargets()` zwraca wszystkie heksy osiągalne w budżecie ruchu, a `moveUnit()` odejmuje koszt całej trasy od `movesLeft` i ustawia `hasActed` dopiero przy zerowym ruchu. `ScenarioScene` używa dwóch kliknięć: pierwszy wybiera cel i rysuje trasę na żółto, drugi na jej końcu potwierdza ruch i animuje token po kolejnych heksach. Koszt terenu pod kursorem trafia do dolnego paska.
- **Konsekwencje:** Jednostki wykorzystują pełny `moveRange`, a droga (koszt 0,5) i teren utrudniony (las, bagno, góry) realnie zmieniają zasięg. Ruch pozostaje testowalny bez Phasera, a podpowiedź, trasa i wykonanie korzystają z tych samych funkcji `core/`, więc nie rozjadą się. `UnitLayer` śledzi pozycje tokenów po `id` i potrafi pominąć własną animację (`setUnits(units, false)`), żeby animacja po trasie nie została nadpisana skokiem do celu. Koszt: każdy klik na mapę uruchamia przeszukiwanie heksów w budżecie ruchu; przy bardzo dużych mapach i wielu jednostkach może to być zauważalne, ale mapa i jednostki są nadal małe. Animacja i rysowanie trasy nie mają testów jednostkowych (ADR-001) — testy `tests/core/state.test.ts` pokrywają logikę ruchu, w tym wybór tańszej trasy.

## ADR-028: Kafelki terenu z plików SVG
- **Status:** Zaakceptowany
- **Kontekst:** Teren był rysowany proceduralnie jako jednolite heksy w kolorze, więc mapa była czytelna, ale płaska. Dostępne są autorskie kafelki SVG dla łąki, wody i miasta, część w dwóch wariantach. Trzeba je wpiąć bez wiązania logiki z Phaserem i bez powielania wyboru wariantu w scenach.
- **Decyzja:** Pliki leżą w `client/src/assets/map/` i są nazwane `<TerrainId>-<wariant>.svg` (`plain-1.svg`, `plain-2.svg`, `water-1.svg`, `water-2.svg`, `city-1.svg`, `city-2.svg`), więc nazwa odpowiada ID terenu z `core/terrain.ts`. `view/terrainTiles.ts` trzyma mapę wariantów, importuje SVG przez Vite (`?url`) i zwraca klucz tekstury dla terenu. Sceny ładują tekstury w `preload()`. `core/terrain.ts` udostępnia `pickVariantIndex(count, random)`, który losuje wariant z zakresu i jest testowalny bez Phasera. `HexMapView` losuje wariant przy tworzeniu kafelka i przy zmianie terenu; teren bez plików SVG nadal korzysta z proceduralnej tekstury heksa. Kafelki nie mają ciemnej fazy (bevelu) na obwodzie — rysunek wypełnia cały heks — a sprite jest skalowany o 3% ponad geometrię heksa, żeby półprzezroczysty rant tekstury nie odsłaniał czarnego tła na styku kafli.
- **Konsekwencje:** Łąka, woda i miasto mają grafiki, a pozostałe tereny działają jak dotąd. Wariant tasuje się przy każdej zmianie terenu i wejściu na mapę, więc sąsiednie pola nie wyglądają identycznie. Nowy teren z SVG wymaga tylko dodania plików zgodnych z nazwą i wpisu w `terrainTiles.ts`; jego rysunek powinien wypełniać cały heks, inaczej na styku kafli zostanie czarna szrama. Assety trafiają do `client/dist/assets` przy buildzie Vite, więc serwer dev i Electron korzystają z tego samego źródła.

