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
- **Menu:** lewy panel dzieli się na pola „NAZWA”, „TEREN” i „JEDNOSTKI”. Jest przyklejony do lewej krawędzi ekranu, a węższe kafelki i skrócony HUD zostawiają więcej miejsca na mapę. Kliknięcie kafelka terenu wybiera pędzel i tryb terenu, kliknięcie kafelka jednostki wybiera rodzaj i tryb jednostek, a przyciski „Niebieska”/„Czerwona” wybierają stronę. Wybrany kafelek ma jaśniejszą obwódkę, a kafelek pod kursorem reaguje na hover.
- **Nazwa mapy:** nowa mapa startuje jako `nowa`; kliknięcie pola „NAZWA” włącza edycję. Wpisywane znaki trafiają do nazwy, `Backspace` usuwa ostatni znak, `Enter` zatwierdza, a `Esc` anuluje. Na czas edycji skróty edytora i kamera są wyłączone. Nazwa ma limit 32 znaków, a pusta wraca do `nowa`. Zapisana nazwa trafia do SQLite i jest widoczna w menu map oraz scenariuszy.
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
- **Opis:** Menu map jest wejściem do edytora. Zawiera pozycję „Nowa mapa” (pusta mapa generatora) oraz jedną listę map z SQLite: wbudowane „Dolina” i „Wzgórza” oraz „Front Wschodni” (seedowane przy otwarciu bazy, dopóki nie ma ich wiersza) i mapy zapisane przyciskiem „ZAPISZ”. Każdy wpis ma miniaturę mapy, nazwę, liczbę kafli/jednostek i datę zapisu; kliknięcie otwiera mapę w edytorze. `ESC` wraca do menu głównego. Poprawki w edytorze są zachowywane w sesji (schowek `registry`) i wracają po otwarciu menu map; szkic ma dopisek „szkic”.
- **Przewijanie:** wszystkie pozycje leżą na jednej liście. Gdy nie mieszczą się na ekranie, kółko myszy przewija zawartość, a pasek po prawej pokazuje pozycję. Tytuł i przycisk powrotu są nieruchome.
- **Pliki:** `client/src/scenes/MapMenuScene.ts`, `client/src/view/scrollList.ts`, `client/src/view/mapCard.ts`, `client/src/view/mapPreview.ts`, `client/src/core/map/catalog.ts`, `client/src/core/map/generator.ts`, `client/src/storage/maps.ts`

## INTERF-005: Scenariusze
- **Status:** Zaimplementowane
- **Opis:** Menu scenariuszy na jednej scenie podzielone na dwie kolumny. Po lewej przewijana lista scenariuszy wbudowanych i zapisanych map. Po prawej panel przygotowania: podgląd mapy, nazwa, opis, statystyki kafli/jednostek, wybór frakcji gracza (`Niebiescy`/`Czerwoni`, domyślnie niebiescy) oraz przyciski `EDYTUJ MAPĘ` i `ROZPOCZNIJ BITWĘ`. Kliknięcie na liście zmienia podgląd bez przejścia do innej sceny.
- **Scena rozgrywki:** mapa z terenem i jednostkami niebieskiej strony gracza oraz czerwonego przeciwnika.
- **Sterowanie:** LPM wybiera jednostkę (jej podgląd i statystyki pojawiają się po lewej stronie dolnego paska), kursor pokazuje teren i jednostkę pod heksem, strzałki/`WASD` przesuwają kamerę, najechanie myszą na krawędź ekranu przewija mapę, środkowy przycisk przeciąga, kółko zmienia zoom, `ESC` wraca do menu głównego. Zoom skaluje wyłącznie mapę i jej nakładki — dolny pasek, przyciski i podpisy zachowują stały rozmiar i położenie. Przewijanie krawędzią działa w tym samym `MapViewport`, co w edytorze map, i jest wyłączone nad dolnym paskiem (poza jego dolną krawędzią) oraz przy wciśniętym przycisku myszy.
- **Pasek dowodzenia:** stały pasek na dole ekranu jest jedynym elementem interfejsu scenariusza. Po lewej pokazuje podgląd tokenu wybranej jednostki oraz jej statystyki: HP/maks. HP, atak, obronę, ruch (`movesLeft/moveRange`), pozycję i teren. W środku znajduje się nazwa i opis scenariusza, liczniki jednostek i kafli, informacja o heksie pod kursorem (teren i koszt ruchu) oraz skróty „MENU SCENARIUSZY” i „MENU GŁÓWNE”. Po prawej jest przycisk „ZAKOŃCZ TURĘ”, pod nim numer tury z aktywną stroną i skróty sterowania. Bez wyboru zamiast tokenu widnieje podpowiedź. Pasek jest częścią kamery interfejsu, więc nie skaluje się i nie przesuwa razem z mapą; blokuje kliknięcia oraz kółko myszy pod swoim obszarem. Dolna krawędź paska (ostatnie 24 px ekranu) działa jednak jak strefa przewijania, więc przejechanie myszą na sam dół przewija mapę.
- **Ruch:** jednostka aktywnej strony z pozostałymi punktami ruchu może przemieścić się po ścieżce wyznaczonej przez heksy o łącznym koszcie nie przekraczającym `movesLeft`, z uwagą na przechodniość terenu, zajęte heksy i koszt ruchu terenu. Dozwolone heksy są obrysowane na zielono. Pierwszy klik na dozwolonym heksie wyznacza najtańszą trasę (obrysowaną na żółto), a drugi klik na jej końcu potwierdza ruch; token animuje się po kolejnych polach trasy. Po ruchu jednostka zużywa punkty za przebyte pole (droga tańsza, las/góry/bagno droższe), a gdy `movesLeft` spadnie do 0 otrzymuje `hasActed` i nie ruszy się do końca tury. Kolejny ruch jest możliwy dopiero po jej następnej turze. Paski statystyk pokazują aktualne `movesLeft/moveRange`.
- **Tury:** obie strony grają się naprzemiennie na jednym PC (hot-seat), bez SI. Aktywna strona i numer tury są w HUD-zie i na dolnym pasku, a przycisk „ZAKOŃCZ TURĘ” (albo `T`) kończy turę i oddaje ruch drugiej stronie. Początek tury przywraca jednostkom aktywnej strony ruch (`movesLeft`) i czyści `hasActed`. Tura jest stanem sesji — przy starcie bitwy pierwsza tura jest stroną wybraną przez gracza; zapisane mapy nie przechowują tury.
- **Scenariusz wbudowany:** „Front Wschodni” — mapa 48×28 (1344 kafle, około 3,8× więcej niż „Dolina”) ze wszystkimi rodzajami terenu i po 10 jednostek każdej strony (piechota, czołgi, artyleria, zwiad).
- **Scenariusz = mapa z SQLite:** lewa lista pokazuje wszystkie mapy z bazy (wbudowane seedowane i zapisane w edytorze), więc każdy scenariusz ma swój wpis w edytorze map. Mapa bez jednostek albo tylko z jedną stroną dostaje brakujące wojsko przy wejściu do scenariusza — niebieskie od lewej, czerwone od prawej krawędzi, na wolnych przechodnich kaflach. Uzupełnienie jest tylko sesyjne i nie zmienia zapisu w SQLite.
- **Edycja mapy:** przycisk `EDYTUJ MAPĘ` otwiera mapę wybranego scenariusza w edytorze map; `ESC` w edytorze wraca do menu scenariuszy. Zapis aktualizuje ten sam wiersz w SQLite, więc zmiana jest od razu widoczna na liście scenariuszy.
- **Generator/mapy:** przycisk `UTWÓRZ SCENARIUSZ` w edytorze zapisuje bieżącą mapę do SQLite i otwiera menu scenariuszy, gdzie nowa mapa jest od razu dostępna do gry.
- **Przewijanie:** lista po lewej przewijana kółkiem myszy.
- **Pliki:** `client/src/scenes/ScenarioMenuScene.ts`, `client/src/scenes/ScenarioScene.ts`, `client/src/view/scrollList.ts`, `client/src/view/mapViewport.ts`, `client/src/core/scenario.ts`, `client/src/core/turn.ts`, `client/src/view/unitLayer.ts`, `client/src/storage/maps.ts`

## INTERF-006: Wewnętrzna baza map (SQLite)
- **Status:** Zaimplementowane
- **Opis:** Klient uruchamia SQLite w WebAssembly (`sql.js`) i trzyma bazę w `localStorage` pod kluczem `mvaw:sqlite`. Baza działa bez backendu, również w Electronie. Tabela `maps` przechowuje nazwę, opis, cały stan gry (teren + jednostki), liczniki kafli/jednostek oraz znaczniki czasu; zapis tego samego identyfikatora aktualizuje wpis. Przy otwarciu bazy `ensureMapsSchema` tworzy tabelę, a `seedBuiltInMaps` wstawia brakujące mapy wbudowane (`dolina`, `wzgórza`) i scenariusz `front-wschodni` z `ON CONFLICT DO NOTHING`; jeśli cokolwiek wstawiono, baza jest od razu utrwalana w `localStorage`. Seed nie nadpisuje zapisanych ani edytowanych wersji.
- **Zakres:** zapis z edytora, odczyt w menu map i menu scenariuszy, seed przy otwarciu bazy. Brak synchronizacji między urządzeniami — to magazyn lokalny przypisany do originu i profilu. Wyczyszczenie danych przeglądarki/Electrona usuwa zapisane mapy. Mapy z edytora nie są przechowywane w MySQL.
- **Szczegóły:** [[Mapy]] — model, schemat, format JSON, limity, kopie i diagnostyka.
- **Pliki:** `client/src/storage/database.ts`, `client/src/storage/mapSerialization.ts`, `client/src/storage/maps.ts`, `client/package.json`
