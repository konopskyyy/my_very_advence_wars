# Interfejs

## INTERF-001: Menu główne
- **Status:** Zaimplementowane
- **Opis:** Ekran startowy z opcjami „Edytor map”, „Mapy” i „Wyjście”. „Wyjście” zamyka okno gry; gdy przeglądarka nie pozwala zamknąć karty, gra wyjaśnia, że trzeba zamknąć okno ręcznie.
- **Pliki:** `client/src/scenes/MenuScene.ts`, `client/src/main.ts`

## INTERF-002: Pole bitwy
- **Status:** Do zrobienia
- **Opis:** Podgląd pola bitwy na siatce heksagonalnej. Scena zastępcza została usunięta z kodu (GRA-009) — wejście prowadzi odtąd do pełnej sceny rozgrywki, z polami bitew i jednostkami.
- **Pliki:** —

## INTERF-003: Edytor map
- **Status:** Zaimplementowane
- **Opis:** Edytor map na siatce heksagonalnej. Służy do **malowania terenu** i **rozstawiania jednostek** na kafelkach.
- **Teren:** łąka (1), las (2), woda (3), góry (4), bagno (5), droga (6), miasto (7).
- **Jednostki:** piechota (1), czołg (2), artyleria (3), zwiad (4); strona niebieska lub czerwona. Token jednostki to kolorowe koło strony z ikoną rodzaju (żołnierz, czołg, działo, zwiad) zamiast litery.
- **Obsługa:**
  - `U` — przełącza tryb terenu i jednostek; wybrany tryb pokazuje HUD,
  - w trybie terenu: LPM maluje wybranym pędzlem (można ciągnąć),
  - w trybie terenu: PPM usuwa kafelek (wraca czarne tło) razem ze stojącą na nim jednostką,
  - `1`–`7` — wybór pędzla terenu (tryb terenu),
  - w trybie jednostek: LPM stawia jednostkę na istniejącym kafelku (zastępuje poprzednią na tym heksie),
  - w trybie jednostek: PPM usuwa jednostkę,
  - `1`–`4` — wybór rodzaju jednostki (tryb jednostek),
  - `C` — przełącza stronę jednostki (niebieska/czerwona),
  - `X` — czyści mapę i jednostki (zostaje czarne tło),
  - `Shift` + strzałki (lub `WASD`) — dokłada kafelki na krawędzi mapy (góra, dół, lewo, prawo); przytrzymanie klawisza rozszerza mapę w kółko,
  - strzałki / `WASD` — przesuwanie kamery, środkowy przycisk — przeciąganie,
  - kółko myszy — zoom,
  - `F` — narzędzie dev: FPS, czas klatki w ms, liczba kafli, czas CPU operacji na bieżącej mapie i rozmiar modelu mapy w pamięci. Działa tylko przy włączonych narzędziach deweloperskich (`?dev=1` w adresie), inaczej HUD nie pokazuje tego skrótu,
  - `ESC` — menu map, `Shift+ESC` — menu główne; w HUD-zie są też przyciski „MENU MAP” i „MENU GŁÓWNE”.
- **Mapa to zbiór kafelków**, nie prostokąt: można malować **poza pierwotnym prostokątem** — na czarnym tle. Współrzędne heksów są absolutne, więc kafelki mogą leżeć także po osi `0` (ujemne `col`/`row`). Zasięg kamery rośnie razem z mapą.
- **Stan edycji:** edytor przechowuje `GameState` (mapa + jednostki + licznik), a szkic w `registry` obejmuje jednostki — po powrocie z menu map wracają na swoje heksy.
- **Odczyt współrzędnych:** HUD podaje pozycję heksa jako `kolumna, wiersz` w **kolumnach podwojonych** (ADR-004): kolumna `2q + r`, więc sąsiednie hexy w wierszu różnią się o 2, a parzystość kolumny zdradza parzystość wiersza. Ten sam zapis dotyczy zasięgu mapy.
- **Pliki:** `client/src/scenes/MapEditorScene.ts`, `client/src/view/hexGrid.ts`, `client/src/view/unitLayer.ts`, `client/src/view/devBar.ts`, `client/src/devTools.ts`, `client/src/core/map/layout.ts`, `client/src/core/map/model.ts`, `client/src/core/map/generator.ts`, `client/src/core/map/metrics.ts`, `client/src/core/state.ts`, `client/src/core/units.ts`, `client/src/core/terrain.ts`

## INTERF-004: Menu map
- **Status:** Zaimplementowane
- **Opis:** Lista map wbudowanych z miniaturą i opisem. Kliknięcie mapy otwiera ją w edytorze do dalszej edycji. `ESC` wraca do menu głównego. Wbudowane mapy: „Dolina” (rzeka, lasy, miasto) i „Wzgórza” (grzbiet gór, jezioro, droga przez bagno) — obie o kształcie nieregularnym (z kafelkami dodanymi na krawędziach). Poprawki w edytorze są zachowywane w sesji (schowek `registry`) i wracają po otwarciu menu map.
- **Pliki:** `client/src/scenes/MapMenuScene.ts`, `client/src/view/mapPreview.ts`, `client/src/core/map/catalog.ts`, `client/src/core/map/generator.ts`
