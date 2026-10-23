# Interfejs

## INTERF-001: Menu główne
- **Status:** Zaimplementowane
- **Opis:** Ekran startowy z opcjami „Scenariusze”, „Edytor map” i „Wyjście”. „Scenariusze” otwiera listę scenariuszy testowych, „Edytor map” otwiera menu map, z którego wybiera się mapę do edycji albo zaczyna nową. „Wyjście” zamyka okno gry; gdy przeglądarka nie pozwala zamknąć karty, gra wyjaśnia, że trzeba zamknąć okno ręcznie.
- **Pliki:** `client/src/scenes/MenuScene.ts`, `client/src/main.ts`

## INTERF-002: Pole bitwy
- **Status:** Do zrobienia
- **Opis:** Podgląd pola bitwy na siatce heksagonalnej. Scena zastępcza została usunięta z kodu (GRA-009) — wejście prowadzi odtąd do pełnej sceny rozgrywki, z polami bitew i jednostkami.
- **Pliki:** —

## INTERF-003: Edytor map
- **Status:** Zaimplementowane
- **Opis:** Edytor map na siatce heksagonalnej. Służy do **malowania terenu** i **rozstawiania jednostek** na kafelkach. Scena ma proporcje 16:9 (1280×720) i jest skalowana przez Phaser `Scale.FIT`, więc na monitorze 16:9 wypełnia cały ekran.
- **Teren:** łąka, las, woda, góry, bagno, droga, miasto.
- **Jednostki:** piechota, czołg, artyleria, zwiad; strona niebieska lub czerwona. Token jednostki to kolorowe koło strony z ikoną rodzaju (żołnierz, czołg, działo, zwiad) zamiast litery.
- **Menu:** lewy panel dzieli się na sekcje „TEREN” i „JEDNOSTKI”. Jest przyklejony do lewej krawędzi ekranu, a węższe kafelki i skrócony HUD zostawiają więcej miejsca na mapę. Kliknięcie kafelka terenu wybiera pędzel i tryb terenu, kliknięcie kafelka jednostki wybiera rodzaj i tryb jednostek, a przyciski „Niebieska”/„Czerwona” wybierają stronę. Wybrany kafelek ma jaśniejszą obwódkę, a kafelek pod kursorem reaguje na hover.
- **Obsługa:**
  - w trybie terenu: LPM maluje wybranym pędzlem (można ciągnąć),
  - w trybie terenu: PPM usuwa kafelek (wraca czarne tło) razem ze stojącą na nim jednostką,
  - w trybie jednostek: LPM stawia jednostkę na istniejącym kafelku (zastępuje poprzednią na tym heksie),
  - w trybie jednostek: PPM usuwa jednostkę,
  - `X` — czyści mapę i jednostki (zostaje czarne tło),
  - `Shift` + strzałki (lub `WASD`) — dokłada kafelki na krawędzi mapy (góra, dół, lewo, prawo); przytrzymanie klawisza rozszerza mapę w kółko,
  - strzałki / `WASD` — przesuwanie kamery, środkowy przycisk — przeciąganie,
  - kółko myszy — zoom,
  - pasek dev w lewym panelu (menu budowania): FPS, czas klatki w ms, liczba kafli, czas CPU operacji na bieżącej mapie i rozmiar modelu mapy w pamięci (tymczasowo, GRA-018),
  - `ZAPISZ` — zapisuje teren i jednostki w wewnętrznej bazie SQLite; komunikat na przycisku potwierdza zapis albo błąd,
  - `ESC` — menu map, `Shift+ESC` — menu główne; w HUD-zie są też przyciski „MENU MAP” i „MENU GŁÓWNE”.
- **Mapa to zbiór kafelków**, nie prostokąt: można malować **poza pierwotnym prostokątem** — na czarnym tle. Współrzędne heksów są absolutne, więc kafelki mogą leżeć także po osi `0` (ujemne `col`/`row`). Zasięg kamery rośnie razem z mapą.
- **Stan edycji:** edytor przechowuje `GameState` (mapa + jednostki + licznik), a szkic w `registry` obejmuje jednostki — po powrocie z menu map wracają na swoje heksy.
- **Odczyt współrzędnych:** HUD podaje pozycję heksa jako `kolumna, wiersz` w **kolumnach podwojonych** (ADR-004): kolumna `2q + r`, więc sąsiednie hexy w wierszu różnią się o 2, a parzystość kolumny zdradza parzystość wiersza. Ten sam zapis dotyczy zasięgu mapy.
- **Pliki:** `client/src/scenes/MapEditorScene.ts`, `client/src/view/mapViewport.ts`, `client/src/view/hexGrid.ts`, `client/src/view/unitLayer.ts`, `client/src/view/devBar.ts`, `client/src/devTools.ts`, `client/src/core/map/layout.ts`, `client/src/core/map/model.ts`, `client/src/core/map/generator.ts`, `client/src/core/map/metrics.ts`, `client/src/core/state.ts`, `client/src/core/units.ts`, `client/src/core/terrain.ts`, `client/src/storage/database.ts`, `client/src/storage/maps.ts`

## INTERF-004: Menu map
- **Status:** Zaimplementowane
- **Opis:** Menu map jest wejściem do edytora. Zawiera pozycję „Nowa mapa” (pusta mapa generatora) oraz listę map wbudowanych z miniaturą i opisem. Kliknięcie mapy otwiera ją w edytorze do dalszej edycji. `ESC` wraca do menu głównego. Wbudowane mapy: „Dolina” (rzeka, lasy, miasto) i „Wzgórza” (grzbiet gór, jezioro, droga przez bagno) — obie o kształcie nieregularnym (z kafelkami dodanymi na krawędziach). Poprawki w edytorze są zachowywane w sesji (schowek `registry`) i wracają po otwarciu menu map.
- **Zapisane mapy:** pod listą wbudowaną pojawia się sekcja „ZAPISANE MAPY (SQLite)” z mapami zapisanymi przyciskiem „ZAPISZ” w edytorze. Wpis pokazuje nazwę, liczbę kafli, jednostek i datę zapisu; kliknięcie otwiera mapę w edytorze. Sekcja pojawia się dopiero, gdy w bazie są zapisane mapy. Zapisana wersja mapy wbudowanej jest scalana z jej kafelkiem: kafelek dostaje dopisek „zapisana” i otwiera stan z bazy zamiast pierwotnej mapy wbudowanej, więc nie pojawia się drugi raz w sekcji zapisanych. Szkic z bieżącej sesji ma pierwszeństwo i jest oznaczony dopiskiem „szkic”.
- **Przewijanie:** wszystkie pozycje (nowa mapa, mapy wbudowane i zapisane) leżą na jednej liście. Gdy nie mieszczą się na ekranie, kółko myszy przewija zawartość, a pasek po prawej pokazuje pozycję. Tytuł i przycisk powrotu są nieruchome.
- **Pliki:** `client/src/scenes/MapMenuScene.ts`, `client/src/view/scrollList.ts`, `client/src/view/mapCard.ts`, `client/src/view/mapPreview.ts`, `client/src/core/map/catalog.ts`, `client/src/core/map/generator.ts`, `client/src/storage/maps.ts`

## INTERF-005: Scenariusze
- **Status:** Zaimplementowane
- **Opis:** Menu scenariuszy jest poligonem testowym gry. Lista pokazuje scenariusze wbudowane z miniaturą, opisem i licznikiem kafli oraz jednostek. Kliknięcie otwiera scenę scenariusza: mapa z terenem i jednostkami niebieskiej strony gracza oraz czerwonego przeciwnika.
- **Sterowanie:** LPM wybiera jednostkę (jej statystyki pojawiają się w HUD-zie), kursor pokazuje teren i jednostkę pod heksem, strzałki/`WASD` przesuwają kamerę, najechanie myszą na krawędź ekranu przewija mapę, środkowy przycisk przeciąga, kółko zmienia zoom, `ESC` wraca do menu scenariuszy, a `Shift+ESC` do menu głównego. Przewijanie krawędzią działa w tym samym `MapViewport`, co w edytorze map, i jest wyłączone nad lewym panelem oraz przy wciśniętym przycisku myszy.
- **Scenariusz wbudowany:** „Front Wschodni” — mapa 48×28 (1344 kafle, około 3,8× więcej niż „Dolina”) ze wszystkimi rodzajami terenu i po 10 jednostek każdej strony (piechota, czołgi, artyleria, zwiad).
- **Zapisane mapy:** jeśli w SQLite są mapy z edytora, menu scenariuszy pokazuje je pod scenariuszem wbudowanym jako dodatkowe mapy testowe.
- **Przewijanie:** scenariusze wbudowane i wszystkie zapisane mapy tworzą jedną listę przewijaną kółkiem myszy, z paskiem pozycji po prawej. Tytuł i przycisk powrotu pozostają nieruchome.
- **Pliki:** `client/src/scenes/ScenarioMenuScene.ts`, `client/src/scenes/ScenarioScene.ts`, `client/src/view/scrollList.ts`, `client/src/view/mapCard.ts`, `client/src/view/mapViewport.ts`, `client/src/core/scenario.ts`, `client/src/view/unitLayer.ts`, `client/src/storage/maps.ts`

## INTERF-006: Wewnętrzna baza map (SQLite)
- **Status:** Zaimplementowane
- **Opis:** Klient uruchamia SQLite w WebAssembly (`sql.js`) i trzyma bazę w `localStorage` pod kluczem `mvaw:sqlite`. Baza działa bez backendu, również w Electronie. Tabela `maps` przechowuje nazwę, opis, cały stan gry (teren + jednostki) i liczniki; zapis tego samego identyfikatora aktualizuje wpis.
- **Zakres:** zapis z edytora, odczyt w menu map i menu scenariuszy. Brak synchronizacji między urządzeniami — to magazyn lokalny. Wyczyszczenie danych przeglądarki usuwa zapisane mapy.
- **Pliki:** `client/src/storage/database.ts`, `client/src/storage/mapSerialization.ts`, `client/src/storage/maps.ts`, `client/package.json`
