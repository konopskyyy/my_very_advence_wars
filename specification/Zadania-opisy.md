# Opisy zadań

Rozszerzone opisy, kryteria i powiązania zadań z tabeli [[Zadania]]. Wpis
w tabeli jest skrótem — pełna treść zadania jest tutaj. Nowe zadanie zakładasz
w obu miejscach: wiersz w [[Zadania#Przegląd]] i sekcja niżej.

Status: ✅ zrobione · 🚧 w toku · ⬜ do zrobienia

## GRA-001: Edytor mapy
- **Status:** ✅ zrobione
- **Opis:** Edytor mapy na siatce heksagonalnej z malowaniem terenu. Mapa jest zbiorem kafelków o absolutnych współrzędnych, więc teren można malować także poza pierwotnym prostokątem — na czarnym tle. Z edytora da się wyjść do menu (`ESC`).
- **Kryteria:** Klikanie/przeciąganie LPM maluje wybrany teren, PPM usuwa kafelek, kliknięcie kafelka w lewym menu zmienia pędzel, X czyści mapę, kamera pan/zoom działa i rośnie wraz z mapą.
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
  - **Uwaga:** od GRA-018 pasek dev jest tymczasowo zawsze widoczny; kryterium „Wyłączone na starcie” opisuje stan sprzed tej zmiany. Okno DevTools Electrona nadal otwiera się tylko przez `ELECTRON_DEVTOOLS=1`.
- **Powiązane:** GRA-006, ADR-007, INTERF-003

## GRA-009: Menu bez pola bitwy, z wyjściem z gry
- **Status:** ✅ zrobione
- **Opis:** Menu główne ma zyskać wyjście z gry, a scena zastępcza pola bitwy ma zniknąć z kodu razem ze skrótem otwierającym ją z edytora. Wpis `INTERF-002` zostaje w dokumentacji jako planowany interfejs.
- **Kryteria:**
  - **Menu:** wpisy „Edytor map” i „Wyjście”; po wyjściu przeglądarka zamyka okno, a gdy przeglądarka tego nie pozwala — gra wyjaśnia, jak zakończyć pracę.
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

## GRA-012: Jednostki w edytorze map
- **Status:** ✅ zrobione
- **Opis:** Edytor map poza malowaniem terenu ma pozwalać rozstawiać jednostki na istniejących kafelkach. Edycja obejmuje cały `GameState` (mapa + jednostki), a nie samą mapę, więc jednostki sąsiadują z terenem w jednym modelu i wracają razem z szkicem mapy.
- **Kryteria:**
  - **Tryb jednostek:** kliknięcie kafelka jednostki w lewym menu wybiera rodzaj (piechota, czołg, artyleria, zwiad) i włącza tryb jednostek; kliknięcie kafelka terenu wraca do malowania. Stronę wybiera się przyciskami w panelu.
  - **Stawianie i usuwanie:** LPM stawia jednostkę wybranej strony, PPM usuwa jednostkę; jednostkę można postawić tylko na istniejącym kafelku, a nowa jednostka na zajętym heksie zastępuje poprzednią.
  - **Widok:** jednostki są rysowane nad terenem jako tokeny w kolorze strony z ikonami rodzaju (czołg, żołnierz, działo, zwiad) zamiast liter; HUD pokazuje tryb, wybraną jednostkę i jednostkę pod kursorem.
  - **Spójność mapy:** usunięcie kafelka usuwa stojącą na nim jednostkę, a wyczyszczenie mapy (`X`) czyści też jednostki.
  - **Sesja:** szkic w `registry` przechowuje cały `GameState`, więc po powrocie z menu map jednostki są na swoich miejscach.
  - **Testy:** operacje `placeUnit`, `removeUnitAt` i `clearUnits` mają testy w `tests/core/state.test.ts`; warstwa widoku pozostaje bez testów jednostkowych (ADR-001).
- **Powiązane:** GRA-002, GRA-003, ADR-003, ADR-004, ADR-011, INTERF-003

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

## GRA-015: Rzeczownikowy opis commitów
- **Status:** ✅ zrobione
- **Opis:** Opis commita po typie conventional (`feat:`, `fix:`, `chore:`) mówi, co zostało zrobione, a nie co należy zrobić. Historia czyta się jako zapis stanu po zmianie, nie jako lista poleceń.
- **Kryteria:**
  - **Zasada:** cała treść po typie jest rzeczownikowa, bez trybu rozkazującego; dotyczy też dłuższych opisów.
  - **Przykład:** `chore: wydzielenie testów klienta do tests/ z lustrzanym drzewem` zamiast `chore: wydziel testy klienta do tests/ z lustrzanym drzewem`.
  - **Miejsce:** reguła jest w `AGENTS.md`, a uzasadnienie w ADR-010.
- **Powiązane:** ADR-010, `AGENTS.md`

## GRA-016: Menu wyboru terenu i jednostek
- **Status:** ✅ zrobione
- **Opis:** Lewy panel edytora zawiera kafelki terenu i jednostek. Wybór narzędzia odbywa się kliknięciem kafelka, a nie klawiszem: kliknięcie terenu przełącza edytor w tryb terenu i ustawia pędzel, kliknięcie jednostki włącza tryb jednostek i wybiera rodzaj. Stronę jednostki wybiera się kliknięciem przycisku w panelu.
- **Kryteria:**
  - **Menu terenu:** wszystkie siedem terenów ma własny kafelek z podglądem heksa i nazwą; kliknięcie wybiera pędzel i tryb terenu.
  - **Menu jednostek:** cztery rodzaje jednostek mają własne kafelki z ikoną i nazwą; kliknięcie wybiera rodzaj i tryb jednostek.
  - **Strona:** przyciski „Niebieska” i „Czerwona” przełączają stronę jednostek; wybrana strona jest wyróżniona.
  - **Wyróżnienie:** wybrany kafelek ma jaśniejszą obwódkę, a kafelek pod kursorem reaguje na hover.
  - **Pozycja:** panel jest przyklejony do lewej krawędzi ekranu, ma węższe kafelki i skrócony HUD, żeby zostawić więcej miejsca na mapę i zmieścić się w pionie.
  - **Bez klawiatury:** wybór terenu, jednostki i strony nie wymaga klawiatury; klawisze pozostają tylko dla kamery, czyszczenia mapy, rozszerzania krawędzi i wyjścia.
- **Powiązane:** GRA-012, ADR-011, ADR-012, INTERF-003

## GRA-017: Wybór mapy przy wejściu do edytora
- **Status:** ✅ zrobione
- **Opis:** Menu główne prowadzi do edytora przez wybór mapy, tak samo jak wyjście z edytora. Zamiast dwóch ścieżek („Edytor map” startujący od razu nową mapę i „Mapy” z listą) zostaje jedno wejście „Edytor map”, które otwiera menu map. Menu map dostaje pozycję „Nowa mapa” dla pustej mapy generatora, obok wbudowanych map i ich szkiców.
- **Kryteria:**
  - **Jedno wejście:** w menu głównym jest „Edytor map” i „Wyjście”; „Edytor map” otwiera menu map, a nie od razu edytor.
  - **Nowa mapa:** menu map ma pozycję „Nowa mapa”, która uruchamia edytor z nową mapą generatora.
  - **Wybór mapy:** kliknięcie wbudowanej mapy otwiera ją w edytorze; szkic z `registry` wraca razem z jednostkami.
  - **Spójność wyjścia:** `ESC`/„MENU MAP” w edytorze wraca do menu map, a `ESC` w menu map wraca do menu głównego.
- **Powiązane:** GRA-006, GRA-009, ADR-013, INTERF-001, INTERF-004

## GRA-018: Tymczasowo zawsze widoczny pasek dev
- **Status:** ✅ zrobione
- **Opis:** Na czas prac diagnostycznych pasek dev w lewym panelu edytora (menu budowania mapy) jest widoczny od razu, bez parametru `?dev=1`. Nie ma klawisza ukrywania; po zakończeniu prac widoczność wróci na żądanie zgodnie z GRA-008.
- **Kryteria:**
  - **Zawsze widoczny:** edytor tworzy pasek dev od pierwszej klatki, bez sprawdzania adresu.
  - **Miejsce:** pasek dev jest sekcją lewego panelu edytora, pod HUD-em i przyciskami wyjścia, a nie osobnym overlayem w prawym górnym rogu.
  - **Zakres:** pasek pokazuje FPS, czas klatki, liczbę kafli, CPU mapy i pamięć mapy/heap.
  - **Bez przełącznika:** `F` nie ukrywa paska, a HUD nie reklamuje tego skrótu.
  - **Powrót:** przywrócenie `?dev=1` wymaga osobnej zmiany; obecny stan jest tymczasowy.
- **Powiązane:** GRA-008, ADR-014, INTERF-003

## GRA-019: Pełny ekran 16:9
- **Status:** ✅ zrobione
- **Opis:** Wewnętrzna scena ma proporcje 16:9 (1280×720), więc na typowym monitorze 16:9 `Scale.FIT` wypełnia zarówno szerokość, jak i wysokość. Na innych proporcjach Phaser nadal zachowuje proporcje i dodaje pasy.
- **Kryteria:**
  - **Proporcje:** `client/src/main.ts` ustawia 1280×720.
  - **Skalowanie:** `Phaser.Scale.FIT` z centrowaniem skaluje scenę do okna bez zniekształceń.
  - **16:9:** na monitorze 16:9 canvas wypełnia cały ekran; inne proporcje mogą mieć pasy.
- **Powiązane:** GRA-016, ADR-015, INTERF-003

## GRA-020: Menu scenariuszy i duża mapa testowa
- **Status:** ✅ zrobione
- **Opis:** Menu główne ma osobny wpis „Scenariusze”, który prowadzi do listy scenariuszy testowych. Pierwszy scenariusz to duża mapa 48×28 (1344 kafle, około 3,8× więcej niż największa mapa wbudowana — „Dolina” ma 352 kafle), z wszystkimi rodzajami terenu i rozstawionymi jednostkami niebieskiej strony gracza oraz czerwonego przeciwnika.
- **Kryteria:**
  - **Wejście:** menu główne zawiera „Scenariusze”, „Edytor map” i „Wyjście”; `ESC` w menu scenariuszy wraca do menu głównego.
  - **Scenariusz:** `client/src/core/scenario.ts` przechowuje `ScenarioDefinition` z pełnym `GameState` (mapa + jednostki), niezależnie od Phasera; katalog zawiera scenariusz „Front Wschodni”.
  - **Mapa:** 48×28 kafli, wszystkie siedem terenów (łąka, las, woda, góry, bagno, droga, miasto), nieregularne pasma gór, rzeka, jeziora, bagna, lasy, drogi i miasta.
  - **Jednostki:** po 10 jednostek na stronę, wszystkie cztery rodzaje (piechota, czołg, artyleria, zwiad); każda jednostka stoi na istniejącym kaflu.
  - **Scena:** `ScenarioScene` rysuje mapę i jednostki, pokazuje podgląd heksa pod kursorem, wybraną jednostkę ze statystykami, liczbę jednostek obu stron i obsługuje kamerę (strzałki/WASD, najechanie na krawędź ekranu, środkowy przycisk, kółko), `ESC` — menu scenariuszy, `Shift+ESC` — menu główne.
  - **Menu scenariuszy:** lista map z SQLite z podglądem, opisem, licznikami i wyborem frakcji; szczegóły w GRA-029.
  - **Testy:** `tests/core/scenario.test.ts` pilnuje rozmiaru mapy (3–4× największej wbudowanej), obecności wszystkich terenów, jednostek obu stron i postawienia ich na kaflach.
- **Powiązane:** GRA-012, ADR-016, INTERF-001, INTERF-005

## GRA-021: Zapis map w wewnętrznym SQLite
- **Status:** ✅ zrobione
- **Opis:** Edytor map zapisuje teren i jednostki w wewnętrznej bazie SQLite działającej w kliencie (WASM), bez zależności od backendu. Baza przeżywa przeładowanie strony i jest wspólna dla przeglądarki oraz Electrona w obrębie profilu użytkownika.
- **Kryteria:**
  - **Baza:** `client/src/storage/database.ts` uruchamia `sql.js` i trzyma plik bazy w `localStorage` pod kluczem `mvaw:sqlite`.
  - **Schemat:** tabela `maps` przechowuje `id`, `name`, `description`, `state` (JSON całego `GameState`), `tiles`, `units`, `created_at`, `updated_at`; zapis tego samego `id` aktualizuje wpis.
  - **Zapis:** przycisk „ZAPISZ” w edytorze zapisuje mapę i jednostki do SQLite; nowa mapa dostaje identyfikator `local-…`, a kolejne zapisy aktualizują ten sam wpis.
  - **Odczyt:** menu map i menu scenariuszy pokazują jedną listę wszystkich map z SQLite; kliknięcie otwiera zapisaną mapę w edytorze albo jako scenariusz.
  - **Serializacja:** `client/src/storage/mapSerialization.ts` zapisuje i waliduje `GameState` (teren, jednostki, amunicja, licznik) — uszkodzony JSON i nieznany teren są odrzucane.
  - **Testy:** `tests/storage/mapSerialization.test.ts` sprawdza round-trip i walidację, a `tests/storage/maps.test.ts` — schemat, zapis, aktualizację i odczyt na prawdziwej bazie `sql.js`.
- **Dokumentacja:** [[Mapy]] — model, schemat, format JSON, trwałość i diagnostyka.
- **Powiązane:** GRA-003, GRA-020, ADR-017, INTERF-004, INTERF-005, INTERF-006

## GRA-022: Wspólny moduł widoku mapy
- **Status:** ✅ zrobione
- **Opis:** Kamera, zoom, przeciąganie, granice mapy i tłumaczenie kursora na heks są wspólne dla edytora i scenariusza. Karty map oraz liczniki i rozstawianie jednostek nie są już kopiowane w każdej scenie.
- **Kryteria:**
  - **Widok:** `client/src/view/mapViewport.ts` obsługuje zoom, przesuwanie kamery, przeciąganie środkowym przyciskiem, granice mapy i `pixelToHex`.
  - **Karty:** `client/src/view/mapCard.ts` tworzy kartę z miniaturą, tytułem, opisem i metadanymi; korzystają z niej menu map i menu scenariuszy.
  - **Model:** `mapTileCount` w `client/src/core/map/model.ts` oraz `deployUnits` i `countUnits` w `client/src/core/state.ts`.
  - **Sceny:** `MapEditorScene` i `ScenarioScene` używają wspólnego widoku zamiast własnych kopii logiki kamery i kursora.
  - **Bez regresji:** edytor nadal maluje, stawia jednostki, rośnie na krawędziach i zapisuje mapę; scenariusz nadal wybiera jednostki i pokazuje statystyki.
  - **Testy:** `tests/core/map/model.test.ts` i `tests/core/state.test.ts` pokrywają nowe funkcje `core/`.
- **Powiązane:** GRA-007, GRA-020, GRA-024, ADR-001, ADR-018, INTERF-003, INTERF-005

## GRA-023: Przewijane listy map i scenariuszy
- **Status:** ✅ zrobione
- **Opis:** Listy w menu map i menu scenariuszy mieszczą się na ekranie 1280×720 i przewijają się kółkiem myszy. Wszystkie zapisane mapy są widoczne na liście, także wtedy, gdy jest ich więcej niż miejsce na ekranie.
- **Kryteria:**
  - **Lista:** `client/src/view/scrollList.ts` ogranicza widoczny obszar nakładkami, przewija kółkiem myszy i rysuje pasek przewijania.
  - **Menu map:** „Nowa mapa” i wszystkie mapy z SQLite (wbudowane, scenariusz i zapisane) tworzą jedną przewijaną listę; „Nowa mapa” jest widoczna także przy pustej liście.
  - **Menu scenariuszy:** wszystkie mapy z SQLite tworzą jedną przewijaną listę; brak osobnych sekcji i duplikatów.
  - **Bez limitu:** znika obcinanie zapisanych map do sześciu wpisów.
  - **Czytelność:** tytuł menu i przycisk powrotu pozostają nieruchome; przewija się tylko zawartość.
- **Powiązane:** GRA-017, GRA-020, ADR-018, INTERF-004, INTERF-005

## GRA-024: Przewijanie kamery krawędzią ekranu
- **Status:** ✅ zrobione
- **Opis:** W scenariuszu i edytorze mapę można przesuwać myszą bez trzymania przycisku: wystarczy najechać kursorem na krawędź ekranu. Zachowanie korzysta ze wspólnego `MapViewport`, więc jest identyczne w obu scenach i działa również w Electronie. Zrealizowane w commicie `eeb3a6b`.
- **Kryteria:**
  - **Pas krawędzi:** kursor w odległości do 24 px od górnej, dolnej, lewej lub prawej krawędzi przewija kamerę w tę stronę z prędkością 620 px/s.
  - **Priorytet UI:** nad lewym panelem przewijanie jest wyłączone, żeby nie kolidować z wyborem terenu, jednostek i przycisków.
  - **Bez konfliktu z klikaniem:** przy wciśniętym przycisku myszy przewijanie krawędzią się zatrzymuje, więc wybór jednostki i malowanie działają normalnie.
  - **Wspólny kod:** `client/src/view/mapViewport.ts` udostępnia opcje `edgePanMargin`, `edgePanSpeed` i `edgePanBlocked`; `ScenarioScene` i `MapEditorScene` tylko je włączają.
  - **Sterowanie:** krawędź ekranu, strzałki/`WASD` i środkowy przycisk działają równolegle; kółko nadal zmienia zoom.
- **Powiązane:** GRA-022, ADR-018, INTERF-003, INTERF-005

## GRA-025: Zapisana wersja mapy wbudowanej w menu map
- **Status:** ✅ zrobione (zastąpione przez GRA-029)
- **Opis:** Zapisana w SQLite wersja mapy wbudowanej jest scalana z jej kafelkiem w menu map. Kliknięcie „Wzgórza” po restarcie otwiera zapisany stan, a nie pierwotną wersję wbudowaną; osobna sekcja zapisanych map zawiera wyłącznie mapy spoza katalogu wbudowanego.
- **Kryteria:**
  - **Scalanie:** kafelek mapy wbudowanej, dla której istnieje zapis o tym samym `id`, korzysta z zapisanego `GameState` i pokazuje metadane zapisu.
  - **Oznaczenie:** kafelek zapisanej wersji ma w tytule dopisek „zapisana”, a kafelek ze szkicem z `registry` — „szkic”; dzięki temu widać, który stan zostanie otwarty.
  - **Bez duplikatu:** zapisana wersja mapy wbudowanej nie pojawia się ponownie w sekcji „ZAPISANE MAPY (SQLite)”.
  - **Bez regresji:** mapy spoza katalogu wbudowanego nadal trafiają do sekcji zapisanych map; szkic z bieżącej sesji ma pierwszeństwo przed stanem z bazy.
  - **Uwaga:** scalanie kafelka z zapisaną wersją zastąpiła jedna lista map z SQLite (GRA-029). Wbudowana mapa i jej zapis to teraz jeden wiersz o tym samym `id`, więc nie ma dwóch wpisów do scalania.
- **Powiązane:** GRA-017, GRA-021, GRA-023, INTERF-004

## GRA-026: Wersjonowane migracje SQLite
- **Status:** ⬜ do zrobienia
- **Opis:** Docelowo schemat `maps` ma być wersjonowany runnerem migracji, żeby dało się bezpiecznie dodawać kolumny i dane startowe. **Obecnie runner nie istnieje:** nie ma `client/src/storage/migrations/`, tabeli `schema_migrations`, kolumny `source` ani pliku `seed/maps.json`. Schemat powstaje przez `CREATE TABLE IF NOT EXISTS` (`MAPS_SCHEMA`) w `client/src/storage/maps.ts`, a mapy startowe wstawia `seedBuiltInMaps()` (GRA-029). Zadanie obejmuje wprowadzenie runnera przy pierwszej rzeczywistej zmianie schematu.
- **Kryteria:**
  - **Stan obecny:** `ensureMapsSchema()` tworzy tabelę `maps` bez wersjonowania; `seedBuiltInMaps()` dosiewa brakujące mapy przy każdym otwarciu bazy i utrwala bazę, jeśli coś wstawił.
  - **Runner:** `client/src/storage/migrations.ts` tworzy tabelę `schema_migrations` i wykonuje migracje w kolejności wersji; każda migracja działa w transakcji, a ponowne uruchomienie nie powtarza zastosowanych wersji.
  - **Migracje:** pierwsza migracja odtwarza obecny schemat, kolejne dodają nowe kolumny (np. `source`) razem z migracją danych.
  - **Bez utraty danych:** migracje nie nadpisują map użytkownika; seed używa `ON CONFLICT(id) DO NOTHING`.
  - **Testy:** `tests/storage/migrations.test.ts` sprawdza pustą bazę, ponowne uruchomienie, bazę w starym schemacie i zachowanie danych użytkownika.
- **Powiązane:** GRA-021, GRA-025, GRA-029, ADR-019, INTERF-006

## GRA-027: Grywalny scenariusz — tury, armie, ruch i stały interfejs
- **Status:** ✅ zrobione
- **Opis:** Scenariusz jest grywalny naprzemiennie: jedna strona jest aktywna, gracz kończy turę przyciskiem albo `T`, a mapy bez jednej ze stron dostają brakujące wojsko tylko na czas sesji. Jednostka aktywnej strony może przesunąć się o jedno sąsiednie pole, a cały interfejs scenariusza pozostaje stały przy zoomie i przewijaniu mapy. Logika tur, armii i ruchu leży w czystych funkcjach `core/` (`turn.ts`, `scenario.ts`, `state.ts`), niezależnych od Phasera.
- **Kryteria:**
  - **Tury:** `TurnState` przechowuje aktywną stronę i numer tury; `nextTurn()` przełącza niebieska → czerwona → niebieska, a `beginTurn()` przywraca ruch tylko jednostkom nowej strony. Przycisk „ZAKOŃCZ TURĘ” i `T` robią to samo; koniec tury czyści wybór i podpowiedzi.
  - **Armie:** `ensureScenarioArmies()` uzupełnia wyłącznie stronę bez jednostek, stawiając piechotę, czołgi, artylerię i zwiad na wolnych, przechodnich kaflach (niebieskie od lewej, czerwone od prawej). Uzupełnienie jest idempotentne, działa tylko w sesji i nie trafia do SQLite; karta mapy pokazuje siły obu stron.
  - **Ruch:** dokładnie jedno pole, bez pathfindingu. Jednostka musi należeć do aktywnej strony, mieć `movesLeft > 0` i nie mieć `hasActed`; cel musi być wolny i przechodni. Po ruchu dostaje `movesLeft = 0` i `hasActed = true`, a wybór zostaje na niej. Dozwolone heksy są obrysowane na zielono i znikają po ruchu lub końcu tury.
  - **Interfejs:** kamera główna skaluje i przewija wyłącznie mapę, a kamera `scenario-ui` renderuje stały interfejs. Dolny pasek dowodzenia jest jedynym elementem UI: po lewej podgląd i statystyki wybranej jednostki, w środku nazwa i opis scenariusza, liczniki, heks pod kursorem i skróty menu, po prawej „ZAKOŃCZ TURĘ”, numer i strona tury. Pasek blokuje kliknięcia i kółko myszy, a jego dolne 24 px nadal przewija mapę.
  - **Testy:** `tests/core/turn.test.ts`, `tests/core/scenario.test.ts` i `tests/core/state.test.ts` sprawdzają przełączanie tur, reset ruchu, uzupełnianie armii, sąsiedztwo, zajęte heksy, wodę i jednostkę po działaniu.
- **Powiązane:** GRA-020, GRA-021, ADR-016, ADR-020, ADR-021, ADR-022, ADR-023, ADR-024, INTERF-005

## GRA-028: Nazwa mapy w edytorze
- **Status:** ✅ zrobione
- **Opis:** Edytor map ma w lewym panelu pole „NAZWA”. Nowa mapa startuje jako `nowa`, a kliknięcie pola pozwala wpisać własną nazwę przed zapisem. Nazwa trafia do SQLite i do menu map oraz menu scenariuszy; wczytana mapa pokazuje swoją nazwę i można ją zmienić.
- **Kryteria:**
  - **Pole:** wiersz „NAZWA” leży pod tytułem panelu; pokazuje aktualną nazwę mapy, a kliknięcie wchodzi w tryb edycji z widocznym kursorem.
  - **Edycja:** wpisywanie znaków, `Backspace`, `Enter` — zatwierdzenie i `Esc` — anulowanie. Pusta nazwa wraca do `nowa`, a długość jest ograniczona do 32 znaków.
  - **Skróty:** podczas edycji nazwy `WASD`, `X`, `Shift` i `Esc` nie sterują edytorem ani kamerą; klawisze trafiają wyłącznie do pola.
  - **Zapis:** „ZAPISZ” używa wpisanej nazwy; dopiero pusta nazwa nowej mapy zapisuje się jako `Mapa lokalna`. Zmiana nazwy istniejącej mapy aktualizuje ten sam wpis w SQLite.
  - **Widoczność:** nazwa jest widoczna w HUD-zie edytora, na karcie w menu map i w menu scenariuszy.
  - **Testy:** `tests/core/map/naming.test.ts` sprawdza przycinanie, limit długości i pustą nazwę.
- **Powiązane:** GRA-021, ADR-017, ADR-025, INTERF-003, INTERF-004

## GRA-029: Menu scenariuszy z podglądem i edycją mapy
- **Status:** ✅ zrobione
- **Opis:** Menu scenariuszy jest jedną sceną z listą map po lewej i panelem przygotowania po prawej. Scenariusz to mapa z SQLite — nie ma osobnej, zaszytej listy scenariuszy ani osobnej tabeli. Mapy wbudowane (`dolina`, `wzgórza`) i scenariusz `front-wschodni` są seedowane do bazy przy jej otwarciu, więc każdy scenariusz ma odpowiadający wpis w edytorze map. Z panelu można rozpocząć bitwę wybraną frakcją albo przejść do edycji mapy.
- **Kryteria:**
  - **Jedna scena:** `ScenarioMenuScene` łączy listę, podgląd mapy, opis, statystyki, wybór frakcji (`Niebiescy`/`Czerwoni`, domyślnie niebiescy) i przyciski `EDYTUJ MAPĘ` oraz `ROZPOCZNIJ BITWĘ`; kliknięcie wpisu zmienia panel bez zmiany sceny.
  - **Scenariusz = mapa:** lewa lista pochodzi wyłącznie z `listSavedMaps()`; `BUILT_IN_SCENARIOS` nie jest już wyświetlany jako osobna lista. `seedBuiltInMaps()` wstawia brakujące `dolina`, `wzgórza` i `front-wschodni` przez `ON CONFLICT(id) DO NOTHING` i utrwala bazę, jeśli coś wstawił.
  - **Filtr:** scenariusz musi mieć co najmniej 16 kafli i po uzupełnieniu `ensureScenarioArmies()` jednostki obu stron; uzupełnienie armii jest sesyjne i nie trafia do SQLite.
  - **Start:** `ROZPOCZNIJ BITWĘ` przekazuje `playerFaction` do `ScenarioScene`; pierwsza tura należy do wybranej strony, a kamera startuje na jej jednostkach.
  - **Edycja:** `EDYTUJ MAPĘ` otwiera mapę scenariusza w `MapEditorScene` z jej stanem z bazy; `ESC` w edytorze wraca do menu scenariuszy, a zapis aktualizuje ten sam wiersz.
  - **Edytor map:** lista map pochodzi wyłącznie z SQLite (jedna lista, bez sekcji); „Stwórz nową mapę” jest widoczny także przy pustej liście; `UTWÓRZ SCENARIUSZ` zapisuje bieżącą mapę i otwiera menu scenariuszy.
  - **Bez duplikatów:** ponowne wejście do `ScenarioMenuScene` czyści listę i wybór; wpisy są deduplikowane po `id`, a spóźniony odczyt z poprzedniego wejścia jest odrzucany przez token sesji.
  - **Testy:** `tests/storage/maps.test.ts` sprawdza, że seed wstawia `dolina`, `wzgórza` i `front-wschodni` dokładnie raz; `npx tsc --noEmit` i pozostałe testy klienta przechodzą.
- **Dokumentacja:** [[Interfejs#INTERF-004: Menu map|INTERF-004]], [[Interfejs#INTERF-005: Scenariusze|INTERF-005]], [[Interfejs#INTERF-006: Wewnętrzna baza map (SQLite)|INTERF-006]], [[Mapy]].
- **Powiązane:** GRA-020, GRA-021, GRA-023, GRA-025, GRA-027, GRA-028, ADR-017, ADR-019, ADR-021, ADR-026, INTERF-004, INTERF-005, INTERF-006

## INFRA-001: Środowisko Docker
- **Status:** ✅ zrobione
- **Opis:** docker-compose + Makefile + usługi client/server/nginx/db/adminer.
- **Powiązane:** `specification/Infrastruktura.md`
