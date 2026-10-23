# Interfejs

## INTERF-001: Menu główne
- **Status:** Zaimplementowane
- **Opis:** Ekran startowy z opcjami „Edytor map” i „Wyjście”. „Edytor map” otwiera menu map, z którego wybiera się mapę do edycji albo zaczyna nową. „Wyjście” zamyka okno gry; gdy przeglądarka nie pozwala zamknąć karty, gra wyjaśnia, że trzeba zamknąć okno ręcznie.
- **Pliki:** `client/src/scenes/MenuScene.ts`, `client/src/main.ts`

## INTERF-002: Pole bitwy
- **Status:** Do zrobienia
- **Opis:** Podgląd pola bitwy na siatce heksagonalnej. Scena zastępcza została usunięta z kodu (GRA-009) — wejście prowadzi odtąd do pełnej sceny rozgrywki, z polami bitew i jednostkami.
- **Pliki:** —

## INTERF-003: Edytor map
- **Status:** Zaimplementowane
- **Opis:** Edytor map na siatce heksagonalnej. Służy do **malowania terenu** i **rozstawiania jednostek** na kafelkach.
- **Teren:** łąka, las, woda, góry, bagno, droga, miasto.
- **Jednostki:** piechota, czołg, artyleria, zwiad; strona niebieska lub czerwona. Token jednostki to kolorowe koło strony z ikoną rodzaju (żołnierz, czołg, działo, zwiad) zamiast litery.
- **Menu:** lewy panel dzieli się na sekcje „TEREN” i „JEDNOSTKI”. Kliknięcie kafelka terenu wybiera pędzel i tryb terenu, kliknięcie kafelka jednostki wybiera rodzaj i tryb jednostek, a przyciski „Niebieska”/„Czerwona” wybierają stronę. Wybrany kafelek ma jaśniejszą obwódkę, a kafelek pod kursorem reaguje na hover.
- **Obsługa:**
  - w trybie terenu: LPM maluje wybranym pędzlem (można ciągnąć),
  - w trybie terenu: PPM usuwa kafelek (wraca czarne tło) razem ze stojącą na nim jednostką,
  - w trybie jednostek: LPM stawia jednostkę na istniejącym kafelku (zastępuje poprzednią na tym heksie),
  - w trybie jednostek: PPM usuwa jednostkę,
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
- **Opis:** Menu map jest wejściem do edytora. Zawiera pozycję „Nowa mapa” (pusta mapa generatora) oraz listę map wbudowanych z miniaturą i opisem. Kliknięcie mapy otwiera ją w edytorze do dalszej edycji. `ESC` wraca do menu głównego. Wbudowane mapy: „Dolina” (rzeka, lasy, miasto) i „Wzgórza” (grzbiet gór, jezioro, droga przez bagno) — obie o kształcie nieregularnym (z kafelkami dodanymi na krawędziach). Poprawki w edytorze są zachowywane w sesji (schowek `registry`) i wracają po otwarciu menu map.
- **Pliki:** `client/src/scenes/MapMenuScene.ts`, `client/src/view/mapPreview.ts`, `client/src/core/map/catalog.ts`, `client/src/core/map/generator.ts`
