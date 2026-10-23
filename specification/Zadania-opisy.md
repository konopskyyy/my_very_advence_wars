# Opisy zadań

Rozszerzone opisy, kryteria i powiązania zadań z tabeli [[Zadania]]. Wpis
w tabeli jest skrótem — pełna treść zadania jest tutaj. Nowe zadanie zakładasz
w obu miejscach: wiersz w [[Zadania#Przegląd]] i sekcja niżej.

Status: ✅ zrobione · 🚧 w toku · ⬜ do zrobienia

## GRA-001: Edytor mapy
- **Status:** ✅ zrobione
- **Opis:** Edytor mapy na siatce heksagonalnej z malowaniem terenu. Mapa jest zbiorem kafelków o absolutnych współrzędnych, więc teren można malować także poza pierwotnym prostokątem — na czarnym tle. Z edytora da się wyjść do menu (`ESC`).
- **Kryteria:** Klikanie/przeciąganie LPM maluje wybrany teren, PPM usuwa kafelek, klawisze 1-7 zmieniają pędzel, X czyści mapę, kamera pan/zoom działa i rośnie wraz z mapą.
- **Powiązane:** ADR-003, ADR-004, ADR-005, INTERF-003

## GRA-002: Model jednostek
- **Status:** 🚧 w toku
- **Opis:** Zdefiniować model jednostek wg ADR-003 (dane, unie dyskryminowane, tabele definicji). Operacje na stanie gry jako czyste funkcje.
- **Powiązane:** ADR-003

## GRA-003: Zapis i wczytywanie map
- **Status:** ⬜ do zrobienia
- **Opis:** Serializacja mapy (zapis do pliku / API) i wczytywanie jej do edytora oraz na pole bitwy.
- **Powiązane:** ADR-005, INTERF-003

## GRA-004: Podstawa budowy mapek
- **Status:** ✅ zrobione
- **Opis:** Zamrożenie stanu po zakończeniu edytora map jako punktu odniesienia dla dalszej pracy nad budową map. Podstawa obejmuje: model terenu i komórek mapy (`core/terrain.ts`, `core/map.ts`), siatkę heksagonalną (`core/hex.ts`), widok heksów (`view/hexGrid.ts`), edytor z menu (`scenes/MapEditorScene.ts`, `scenes/MenuScene.ts`) oraz testy modelu.
- **Kryteria:** Model mapy jest niezależny od silnika i przetestowany; edytor pozwala malować teren poza pierwotnym prostokątem; stan można cofnąć do tego punktu (`8600483`).
- **Powiązane:** ADR-004, ADR-005, GRA-001, GRA-003, INTERF-003

## GRA-005: Punkt bazowy — stan po ostatnim commicie
- **Status:** ✅ zrobione
- **Opis:** Ostatni commit `8600483` („chore: punkt bazowy — podstawa budowy mapek”) zamyka etap budowy edytora map i wyznacza stan wyjściowy dla dalszej pracy nad generatorem map. Sam commit zmienia wyłącznie `specification/Zadania.md` (dodaje GRA-004) — kod i testy pochodzą z `fefef9a`. Stan repozytorium: model terenu i komórek mapy (`core/terrain.ts`, `core/map.ts`), siatka heksagonalna (`core/hex.ts`), widok heksów (`view/hexGrid.ts`), edytor map z menu (`scenes/MapEditorScene.ts`, `scenes/MenuScene.ts`), pole bitwy jako placeholder (`scenes/BattlefieldScene.ts`) oraz testy modelu (`core/*.test.ts`).
- **Kryteria:** `master` wskazuje na `8600483`; `npm test` w `client/` przechodzi; edytor uruchamia się z menu głównego („Edytor map”), a `ESC` wraca do menu; mapa jest zbiorem kafelków o absolutnych współrzędnych — da się malować poza pierwotnym prostokątem.
- **Powiązane:** GRA-001, GRA-004, ADR-004, ADR-005

## GRA-006: Rozbudowa generatora map
- **Status:** ✅ zrobione
- **Opis:** Generator map ma dorosnąć do narzędzia do tworzenia i obróbki gotowych map: rozszerzanie mapy o kafelki na krawędziach, licznik klatek (narzędzie dev), jawne wyjście z edytora oraz osobne menu z listą map, z której da się otworzyć istniejącą mapę do edycji.
- **Kryteria:**
  - **Kafelki na krawędziach:** generator startuje od prostokąta 22×14 i rozszerza go o kolejne kafelki poza obecnym zasięgiem (góra, dół, lewo, prawo). Rozszerzenie nie przesuwa istniejących heksów — model mapy dopuszcza dowolny kształt (ADR-005), a zasięg kamery rośnie razem z mapą.
  - **Narzędzie dev:** w edytorze działa licznik pokazujący liczbę klatek na sekundę (FPS) i czas pojedynczej klatki w ms; wskazania czytelne w HUD-zie i wyłączone klawiszem (np. `F`), żeby nie zaśmiecać interfejsu.
  - **Wyjście z edytora:** z edytora da się wyjść w dwa miejsca — do menu map i do menu głównego (`ESC`), z wyraźnie podpowiedzialnym skrótem i przyciskiem w HUD-zie; wyjście nie gubi zapisanej mapy.
  - **Menu map:** nowa scena z listą co najmniej dwóch wbudowanych map (stałe mapy w kodzie, bez plików zewnętrznych do czasu GRA-003); kliknięcie pozycji otwiera tę mapę w edytorze do dalszej edycji, `ESC` wraca do menu głównego. Do zaimplementowania dodać wpis `INTERF-004` w `specification/Interfejs.md`.
- **Powiązane:** GRA-001, GRA-003, GRA-004, GRA-005, ADR-004, ADR-005, INTERF-003

## GRA-007: Moduł mapy i algorytm układu heks
- **Status:** ✅ zrobione
- **Opis:** Kod mapy był rozproszony po `core/hex.ts`, `core/map.ts`, `core/mapGenerator.ts`, `core/maps.ts` i `view/hexGrid.ts`, a część matematyki (zasięg mapy w pikselach) leżała w warstwie widoku, a dokumentacja (ADR-004, ADR-005) opisywała inny układ plików. Mapa dostaje własny moduł `client/src/core/map/`, a cała matematyka siatki — jeden plik `layout.ts`. Warstwa widoku zostaje wyłącznie rysowaniem.
- **Kryteria:**
  - **Moduł mapy:** `client/src/core/map/` z plikami `layout.ts` (algorytm siatki), `model.ts` (model mapy i operacje), `generator.ts` (generator), `catalog.ts` (wbudowane mapy) i `index.ts` (publiczne API modułu). Stare `core/hex.ts`, `core/map.ts`, `core/mapGenerator.ts` i `core/maps.ts` znikają, a ich testy przechodzą do `core/map/`.
  - **Algorytm w jednym pliku:** `layout.ts` zawiera konwersje offset odd-r ↔ axial, piksel ↔ hex, narożniki heksa, odległość i sąsiedztwo. Zasięg mapy w pikselach (`mapPixelBounds`) wraca do `core/`, bo to czysta matematyka, a nie rysowanie.
  - **Widok tylko rysuje:** `view/hexGrid.ts` nie ma już importów logiki mapy poza typami i konwersjami — nie liczy pozycji modelu samodzielnie.
  - **Zgodność z dokumentacją:** ADR-004 i ADR-005 opisują nowy układ plików, a ADR-006 ustala granicę między modułem mapy a warstwą widoku (offset podglądu nie zmienia modelu).
  - **Testy:** konwersje heks, model mapy i generator mają testy w `core/map/`; testy przypinają regułę parzystości z ADR-005 (parzystość z bezwzględnego `row`) oraz to, że dodanie kafelka na krawędzi nie przesuwa istniejących heksów.
- **Powiązane:** GRA-004, GRA-005, GRA-006, ADR-004, ADR-005, ADR-006, INTERF-003, INTERF-004

## GRA-008: Narzędzia deweloperskie i dev bar mapy
- **Status:** ✅ zrobione
- **Opis:** Narzędzia deweloperskie mają być wyłączone przy zwykłym uruchomieniu aplikacji, a edytor (generator) map ma mieć własny pasek diagnostyczny pokazujący koszt pracy z daną mapą: czas CPU operacji na mapie oraz zajmowaną pamięć.
- **Kryteria:**
  - **Wyłączone na starcie:** pasek dev nie powstaje, dopóki narzędzia nie zostaną jawnie włączone parametrem `?dev=1` w adresie. Klawisz `F` działa tylko przy włączonych narzędziach, a HUD nie reklamuje skrótów, które nic nie robią.
  - **DevTools Electrona:** okno DevTools nie otwiera się samo — włącza się je zmienną `ELECTRON_DEVTOOLS=1`.
  - **Dev bar mapy:** w edytorze pasek pokazuje FPS, czas klatki, liczbę kafli, czas CPU poświęcony na operacje na bieżącej mapie (łącznie i ostatnia) oraz rozmiar modelu mapy w pamięci (i stertę JS, gdy przeglądarka ją udostępnia).
  - **Pomiary w `core/`:** pomiar czasu i rozmiaru modelu to czysta logika (`client/src/core/map/metrics.ts`) z testami; warstwa widoku tylko pokazuje wyniki.
- **Powiązane:** GRA-006, ADR-007, INTERF-003

## GRA-009: Menu bez pola bitwy, z wyjściem z gry
- **Status:** ✅ zrobione
- **Opis:** Menu główne ma zyskać wyjście z gry, a scena zastępcza pola bitwy ma zniknąć z kodu razem ze skrótem otwierającym ją z edytora. Wpis `INTERF-002` zostaje w dokumentacji jako planowany interfejs.
- **Kryteria:**
  - **Menu:** wpisy „Edytor map”, „Mapy” i „Wyjście”; po wyjściu przeglądarka zamyka okno, a gdy przeglądarka tego nie pozwala — gra wyjaśnia, jak zakończyć pracę.
  - **Pole bitwy:** `BattlefieldScene` usuwa się z kodu i z listy scen, skrót `B` znika z edytora, a `INTERF-002` w `specification/Interfejs.md` zostaje jako pozycja zaplanowana (bez plików i bez statusu „zaimplementowane”).
- **Powiązane:** GRA-001, INTERF-001, INTERF-002, INTERF-003

## GRA-010: Strona gry bez paska przewijania
- **Status:** ✅ zrobione
- **Opis:** Gra nie przewija strony — po prawej stronie okna nie może pojawiać się suwak przewijania.
- **Kryteria:**
  - **Układ strony:** `client/src/style.css` zeruje marginesy strony, ustawia tło na kolor gry i blokuje przewijanie (`overflow: hidden`), a kontener `#app` zajmuje cały widok.
  - **Efekt:** strona nie ma większej zawartości niż okno (`scrollHeight === clientHeight`), więc suwak nie występuje.
- **Powiązane:** GRA-009, INTERF-001

## GRA-011: Podwojone kolumny w odczycie edytora
- **Status:** ✅ zrobione
- **Opis:** Odczyt współrzędnych heksa w edytorze ma być jednoznaczny: wiersze liczone 0, 1, 2…, a kolumny co 2, z parzystością zależną od wiersza (kolumna podwojona `2q + r`). W offset odd-r kolumna przeskakuje między dwoma wartościami zależnie od parzystości wiersza, więc ten sam pion na mapie ma w kolejnych wierszach różne numery kolumn.
- **Kryteria:**
  - **Wzory w dokumentacji:** ADR-004 podaje wzory na offset odd-r, axial `(q,r)` i kolumnę podwojną wraz z tym, jak się przeliczają.
  - **Odczyt w HUD-zie:** pozycja heksa i zasięg mapy pokazywane są w kolumnach podwojonych: sąsiednie hexy w wierszu różnią się o 2, parzystość kolumny zdradza parzystość wiersza, a numer jest wspólny dla całej mapy (nie resetuje się co wiersz). Model mapy nadal trzyma offset odd-r (ADR-005) — zmienia się tylko odczyt.
  - **Matematyka w `core/`:** konwersje do/z kolumny podwojonej i zasięg w tej skali leżą w `client/src/core/map/` i mają testy.
- **Powiązane:** ADR-004, ADR-005, GRA-001, INTERF-003

## GRA-013: Testy klienta w lustrzanym drzewie
- **Status:** ✅ zrobione
- **Opis:** Testy jednostkowe klienta leżą poza katalogiem kodu produkcyjnego. `client/src/` zawiera wyłącznie moduły gry, a `client/tests/` odtwarza jego drzewo: moduł `src/core/map/model.ts` ma test `tests/core/map/model.test.ts`. Regułę pilnuje test struktury, więc rozjazd nazw lub test w `src/` zatrzymuje `npm test`.
- **Kryteria:**
  - **Lustro ścieżek:** każdy plik `tests/**/*.test.ts` wskazuje odpowiadający mu moduł w `src/` (ta sama ścieżka bez `.test.ts`).
  - **Kod produkcyjny bez testów:** w `src/` nie ma plików `*.test.ts`, a importy w testach są względne i wskazują dokładnie testowany moduł.
  - **Pilnowanie reguły:** `tests/structure.test.ts` sprawdza obie strony lustra; jest jedynym testem bez odpowiednika w `src/`.
  - **Konfiguracja:** Vitest zbiera wyłącznie `tests/**/*.test.ts`, a `tsc --noEmit` obejmuje także `tests/`.
  - **Dokumentacja:** zasady i przykłady opisuje [[Konwencje]], decyzję — ADR-008.
- **Powiązane:** ADR-008, `specification/Konwencje.md`

## GRA-014: CI typów TypeScript
- **Status:** ✅ zrobione
- **Opis:** Pull requesty i pushe na `master` przechodzą wspólny check typów TypeScript. Pipeline GitHub Actions instaluje zależności klienta i uruchamia `tsc --noEmit`; nie buduje aplikacji, nie uruchamia testów i nie wymaga Dockera ani sekretów.
- **Kryteria:**
  - **Wyzwalacze:** workflow `.github/workflows/ci.yml` startuje przy pushu na `master`, przy pull requeście i ręcznie (`workflow_dispatch`).
  - **Zakres:** Node 22, `npm ci` z cache opartym na `client/package-lock.json` i `npx tsc --noEmit` w `client/` — bez Vitest, `vite build` i Dockera.
  - **Uprawnienia:** tylko odczyt repozytorium (`contents: read`).
  - **Dokumentacja:** sekcja [[Infrastruktura#CI (GitHub Actions)]] opisuje pipeline, a ADR-009 uzasadnia zakres.
- **Powiązane:** ADR-009, `specification/Infrastruktura.md`

## INFRA-001: Środowisko Docker
- **Status:** ✅ zrobione
- **Opis:** docker-compose + Makefile + usługi client/server/nginx/db/adminer.
- **Powiązane:** `specification/Infrastruktura.md`
