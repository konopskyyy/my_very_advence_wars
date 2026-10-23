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
- **Konsekwencje:** Scenariusze są testowalne w `tests/core/scenario.test.ts` bez uruchamiania gry, a przyszła mechanika (ruch, walka, tury) dostaje jedno miejsce rozwoju. Scena na razie nie zmienia stanu — służy do oglądania i wybierania jednostek; rozgrywka będzie osobnym zadaniem.

## ADR-017: Wewnętrzna baza map w SQLite (sql.js)
- **Status:** Zaakceptowany
- **Kontekst:** Edytor tworzy teren i jednostki, ale po zamknięciu sceny lub przeładowaniu strony szkic znikał. Backend Symfony ma MySQL na potrzeby przyszłej rozgrywki sieciowej, ale zapis mapy w tej fazie nie powinien wymagać działającego serwera — gra ma działać także w Electronie i w przeglądarce bez backendu. Potrzebna jest lekka, lokalna baza.
- **Decyzja:** Wewnętrzna baza to SQLite uruchamiany w kliencie przez `sql.js` (WASM). Plik bazy jest trzymany w `localStorage` pod kluczem `mvaw:sqlite`, a schemat tworzy `client/src/storage/maps.ts`. Tabela `maps` przechowuje metadane, liczniki i cały `GameState` jako JSON; zapis tego samego `id` robi upsert. Warstwy: `storage/database.ts` (inicjalizacja i trwałość), `storage/mapSerialization.ts` (walidacja JSON) i `storage/maps.ts` (schemat i operacje). Backend i MySQL pozostają bez zmian. Szczegóły formatu, schematu i diagnostyki: [[Mapy]].
- **Konsekwencje:** Mapy przeżywają przeładowanie i są wspólne dla scen w obrębie tego samego originu i profilu (przeglądarka lub Electron), ale nie między przeglądarką a Electronem. Nie ma synchronizacji między urządzeniami — to świadomie lokalny magazyn. Limit `localStorage` (około 5 MB) wystarcza na dziesiątki map, ale duże mapy trzeba będzie przenieść do IndexedDB lub API razem z GRA-003. `sql.js` dodaje do builda plik WASM (~685 kB) i wymaga asynchronicznego otwarcia bazy, więc menu i zapis obsługują `Promise`. Schemat ma `CREATE TABLE IF NOT EXISTS`, a uszkodzony plik bazy jest odrzucany i zastępowany nową bazą. Zapis mapy wbudowanej zachowuje jej `id`, a menu map scala zapisaną wersję z kafelkiem mapy wbudowanej.

## ADR-018: Wspólny widok mapy i przewijane listy
- **Status:** Zaakceptowany
- **Kontekst:** `MapEditorScene` i `ScenarioScene` niezależnie liczyły granice kamery, zoom, przeciąganie i tłumaczenie kursora na heks. Menu map i menu scenariuszy powielały budowę kart z miniaturą, a przy większej liczbie zapisanych map zawartość wychodziła poza ekran 720 px — bez możliwości przewinięcia. Każda poprawka tych elementów wymagała zmian w kilku miejscach.
- **Decyzja:** Wspólne elementy widoku mapy trafiają do `client/src/view/`: `mapViewport.ts` (kamera, zoom, przeciąganie, przewijanie krawędzią ekranu, granice mapy, kursor → heks), `mapCard.ts` (karta mapy lub scenariusza z miniaturą i metadanymi) oraz `scrollList.ts` (lista ograniczona nakładkami, przewijana kółkiem myszy, z paskiem pozycji). Czyste operacje pozostają w `core/`: `mapTileCount` w `core/map/model.ts` oraz `deployUnits` i `countUnits` w `core/state.ts`. Sceny i menu korzystają z tych modułów zamiast własnych kopii. Próg decyzji: matematyka mapy i stan w `core/` bez Phasera (ADR-001), a wszystko, co tworzy obiekty Phasera, w `view/`.
- **Konsekwencje:** Zmiana zachowania kamery, wyglądu karty lub sposobu przewijania odbywa się w jednym pliku. Listy map i scenariuszy pokazują wszystkie wpisy, a nadmiar przewija się kółkiem myszy; pasek po prawej pokazuje pozycję. Widok nadal zależy od Phasera, więc nie ma dla niego testów jednostkowych — testowane są tylko nowe funkcje `core/`.
