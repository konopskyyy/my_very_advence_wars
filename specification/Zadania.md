# Zadania

## GRA-001: Edytor mapy
- **Status:** Zrobione
- **Opis:** Edytor mapy na siatce heksagonalnej z malowaniem terenu. Mapa jest zbiorem kafelków o absolutnych współrzędnych, więc teren można malować także poza pierwotnym prostokątem — na czarnym tle. Z edytora da się wyjść do menu (`ESC`) i na pole bitwy (`B`).
- **Kryteria:** Klikanie/przeciąganie LPM maluje wybrany teren, PPM usuwa kafelek, klawisze 1-7 zmieniają pędzel, X czyści mapę, kamera pan/zoom działa i rośnie wraz z mapą.
- **Powiązane:** ADR-003, ADR-004, ADR-005, INTERF-003

## GRA-002: Model jednostek
- **Status:** W toku
- **Opis:** Zdefiniować model jednostek wg ADR-003 (dane, unie dyskryminowane, tabele definicji). Operacje na stanie gry jako czyste funkcje.
- **Powiązane:** ADR-003

## GRA-003: Zapis i wczytywanie map
- **Status:** Do zrobienia
- **Opis:** Serializacja mapy (zapis do pliku / API) i wczytywanie jej do edytora oraz na pole bitwy.
- **Powiązane:** ADR-005, INTERF-003

## GRA-004: Podstawa budowy mapek
- **Status:** Zrobione
- **Opis:** Zamrożenie stanu po zakończeniu edytora map jako punktu odniesienia dla dalszej pracy nad budową map. Podstawa obejmuje: model terenu i komórek mapy (`core/terrain.ts`, `core/map.ts`), siatkę heksagonalną (`core/hex.ts`), widok heksów (`view/hexGrid.ts`), edytor z menu (`scenes/MapEditorScene.ts`, `scenes/MenuScene.ts`) oraz testy modelu.
- **Kryteria:** Model mapy jest niezależny od silnika i przetestowany; edytor pozwala malować teren poza pierwotnym prostokątem; stan można cofnąć do tego punktu (`10a2cfd`).
- **Powiązane:** ADR-004, ADR-005, GRA-001, GRA-003, INTERF-003

## INFRA-001: Środowisko Docker
- **Status:** Zrobione
- **Opis:** docker-compose + Makefile + usługi client/server/nginx/db/adminer.
- **Powiązane:** `specification/Infrastruktura.md`
