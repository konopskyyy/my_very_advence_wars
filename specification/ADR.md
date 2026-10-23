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
- **Decyzja:** Używamy heksów o układzie **pointy-top**. Cała matematyka siatki (konwersje offset ↔ axial ↔ podwojona, piksel ↔ hex, narożniki heksa, odległość, sąsiedztwo) jest w jednym pliku: `client/src/core/map/layout.ts`. Warstwa widoku nie liczy pozycji heksów samodzielnie — bierze je z tego modułu. Edytor maluje **teren**, nie jednostki. Pozycja jednostek w modelu wyrażana jest w koordynatach heksagonalnych.
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
- **Status:** Zaakceptowany
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
