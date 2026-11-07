# Archiwum zadań

**To jest zapis historyczny — nie szukaj tutaj zadań do pracy.** Aktualne
zadania, ich statusy i powiązania są wyłącznie w [[Zadania]], a pełne opisy
w [[Zadania-opisy]]. Archiwum zawiera duplikaty i wersje zastąpione późniejszą
pracą; zostaje tylko po to, żeby dało się prześledzić historię decyzji.

## Archiwum: duplikat GRA-044 — Zasięg strzału zgodny z akcją jednostki

Druga, identyczna kopia sekcji `GRA-044` z `Zadania-opisy.md`. Zadanie nadal
obowiązuje jako `GRA-044` w [[Zadania-opisy]]; tutaj leży tylko nadmiarowy
wpis usunięty z aktywnego pliku.

- **Kontekst:** W pierwszej misji samouczka czerwony piechur jest widoczny z odległości dwóch heksów, ale piechota atakuje tylko z jednego. Po dojściu na sąsiedni heks wyczerpanie ruchu ustawia `hasActed`, a scena nadal rysuje czerwony obrys zasięgu strzału. Kliknięcie wroga nie zadaje wtedy obrażeń, więc interfejs obiecuje akcję, której `canAttack()` nie pozwala wykonać. Po ruchu scena dodatkowo czyści wszystkie obrysy, więc znika też informacja o pozostałym ruchu i wzroku.
- **Opis:** Czysty moduł `client/src/core/combat.ts` dostaje `canAttackThisTurn()`, które wydziela warunki atakującego: brak `hasActed` i dodatnią amunicję. `canAttack()` korzysta z tej funkcji, więc zasady walki pozostają bez zmian. `ScenarioScene` rysuje czerwony zasięg strzału wyłącznie dla jednostki aktywnej strony, która może jeszcze atakować; po potwierdzeniu ruchu odtwarza obrysy przez `drawRangeHints()` zamiast je czyścić, dzięki czemu nadal zaznaczona jednostka pokazuje aktualny ruch, wzrok i ewentualny zasięg strzału.
- **Kryteria:**
  - **Zasięg strzału:** czerwony obrys pojawia się tylko dla jednostki aktywnej strony bez `hasActed` i z dodatnią amunicją; jednostka po ataku albo po wyczerpaniu ruchu go nie pokazuje.
  - **Po ruchu:** nadal zaznaczona jednostka od razu pokazuje aktualne obrysy; zielony ruch znika, gdy `movesLeft` spadnie do zera, a wzrok i strzał wynikają z bieżącego stanu.
  - **Zasady:** `canAttack()` zachowuje dotychczasowe warunki i zachowanie; nowa funkcja nie zmienia ruchu, obrażeń ani amunicji.
  - **Testy:** `tests/core/combat.test.ts` pokrywa `canAttackThisTurn()` dla jednostki gotowej, po akcji i bez amunicji.
  - **Dokumentacja:** INTERF-005 i GRA-044 opisują widoczność obrysu strzału oraz odświeżanie zasięgów po ruchu.

## Archiwum: GRA-045 — Obrys zasięgu wzroku po krawędziach heksów

**Zastąpione przez:** GRA-048 (mgiełka zamiast obrysu), a następnie GRA-050
(mgła wojny z pamięcią odkrytych pól). `outlineHexArea()` i `hexBoundaryEdges()`
zostały usunięte z kodu.

- **Kontekst:** Zasięg wzroku był rysowany jako osobny, pomniejszony obrys w każdym heksie. Sąsiednie kafle dublowały wspólne krawędzie, więc obszar wyglądał jak siatka wewnętrznych ramek, a nie jak jeden zasięg. Granica nie pokrywała się też z rzeczywistymi krawędziami heksów.
- **Opis:** Czysta funkcja `hexBoundaryEdges()` w `client/src/core/map/layout.ts` zbiera krawędzie heksów z podanych środków i zwraca tylko te, które występują raz — czyli zewnętrzną granicę obszaru, także wokół dziur po brakujących kaflach. `view/hexGrid.ts` dostaje `outlineHexArea()`, które rysuje tę granicę jedną niebieską linią. `ScenarioScene` używa jej dla zasięgu wzroku zamiast obrysowywać każdy kafel osobno; ruch i strzał nadal korzystają z obrysów kafli. Wzrok jest rysowany po ruchu i strzale, więc niebieska granica leży nad zielonymi i czerwonymi obrysami i jest widoczna od razu po wybraniu jednostki. Rozwiązanie zostało zastąpione przez GRA-048 (mgiełka zamiast obrysu).
- **Kryteria:**
  - **Granica:** pojedynczy heks daje sześć krawędzi, dwa sąsiednie heksy dziesięć, a dwa rozłączne dwanaście.
  - **Rysowanie:** zasięg wzroku to jedna linia po zewnętrznych krawędziach heksów, bez wewnętrznych ramek i bez dublowania wspólnych krawędzi.
  - **Widoczność:** wzrok pojawia się natychmiast po wybraniu jednostki, także gdy jednostka ma jeszcze ruch; kolejność warstw nie pozwala zielonym obrysom ruchu zasłonić niebieskiej granicy.
  - **Zakres:** zmiana dotyczy wyłącznie wizualizacji wzroku; ruch, strzał, mgła wojny i zasady gry pozostają bez zmian.
  - **Testy:** `tests/core/map/layout.test.ts` pokrywa liczbę i unikalność krawędzi granicy dla jednego heksa, pary sąsiadów i obszarów rozłącznych.
  - **Dokumentacja:** ADR-031 i INTERF-005 opisują obrys wzroku po krawędziach heksów.

## Archiwum: GRA-047 — Ruch w pasku po akcji jednostki

**Zastąpione przez:** GRA-049, które liczy dostępność ruchu przez `canMoveNow()`
zamiast samego `hasActed` i `movesLeft`.

- **Kontekst:** Piechota, czołg i zwiad po ataku dostają `hasActed`, ale zachowują pełne `movesLeft`. Dolny pasek pokazywał wtedy np. `Ruch 2/2`, więc wyglądało to tak, jakby jednostka nadal mogła się ruszyć, mimo że ruch był zablokowany.
- **Opis:** `ScenarioCommandBar.refreshUnit()` liczy `canMove` z `!current.hasActed && current.movesLeft > 0`. Gdy jednostka nie może już działać, pasek pokazuje `Ruch 0/moveRange` i szarzeje tę wartość; jednostka gotowa do ruchu nadal pokazuje rzeczywiste `movesLeft` na zielono. Status „Działała — ruch w następnej turze” pozostaje bez zmian. Poprawka jest wyłącznie prezentacyjna i nie zmienia `GameState`.
- **Kryteria:**
  - **Po akcji:** jednostka z `hasActed` pokazuje `Ruch 0/...` i nie sugeruje dostępnego ruchu.
  - **Gotowa:** jednostka bez `hasActed` i z `movesLeft > 0` pokazuje rzeczywisty zapas ruchu na zielono.
  - **Artyleria:** po strzale z pozostałym ruchem nadal pokazuje ułamkowe `movesLeft`; dopiero `hasActed` zeruje prezentowany ruch.
  - **Brak wpływu na stan:** zmiana nie modyfikuje jednostek, tur ani zapisu mapy.
  - **Dokumentacja:** INTERF-005 opisuje zachowanie wskaźnika ruchu po akcji.

## Archiwum: GRA-048 — Mgiełka zasięgu wzroku

**Zastąpione przez:** GRA-050 (mgła wojny z pamięcią odkrytych pól). Opis
dotyczy pierwotnej wersji mgły rysowanej tylko dla wybranej jednostki.

- **Kontekst:** Zasięg wzroku był niebieską linią po krawędziach heksów. Granica czytała się jak geometria, a nie jak obszar widzenia; gracz chciał lekkiej mgiełki zamiast obrysu.
- **Opis:** Opis dotyczy pierwotnej wersji; od GRA-050 mgła zasięgu jest częścią mgły wojny i korzysta z kafelka `assets/map/ai/fog_of_war_tile.svg`. Nowy `client/src/view/visionFog.ts` generuje powtarzalny wzór mgły (periodyczny szum, jasnoniebieska barwa, alpha 10–32%) na osobnej kanwie 192 px. `CanvasTexture` jest dopasowywana do prostokąta otaczającego kafle zasięgu, a `Image` z originem `(0, 0)` leży na głębokości 1 — nad terenem (0), pod jednostkami (2) — więc nie zasłania tokenów. Przy każdej zmianie wyboru mgła jest rysowana od nowa: pomocnicza kanwa przycina się do sumy heksów zasięgu ścieżkami Canvas 2D, wypełnia wzorem przesuniętym o dryf i trafia do tekstury z rozmyciem 3 px. `update()` przesuwa wzór i odświeża teksturę co 120 ms, więc mgła delikatnie dryfuje. `ScenarioScene.drawRangeHints()` pokazuje ją dla wybranej jednostki z skończonym `visionRange`, a ukrywa przy braku wyboru, dla artylerii (`∞`) i po zakończeniu tury. Obrys wzroku i pomocnicze `outlineHexArea()` / `hexBoundaryEdges()` zostały usunięte. Świadomie nie użyto `GeometryMask`, bo w Phaserze 4 działa ona tylko w rendererze Canvas, a gra korzysta z WebGL.
- **Kryteria:**
  - **Wygląd:** zasięg wzroku to półprzezroczysta, chmurna mgiełka na heksach, bez niebieskiej linii i bez wewnętrznych ramek.
  - **Zakres:** mgła pokrywa wyłącznie kafle w zasięgu wybranej jednostki i zmienia się po ruchu, ataku oraz zmianie wyboru.
  - **Warstwy:** mgła jest nad terenem, ale pod tokenami jednostek; nie zasłania jednostek ani obrysów ruchu i strzału.
  - **Widoczność:** mgła pojawia się od razu po wybraniu jednostki i znika przy braku wyboru, dla `visionRange = ∞` oraz po zakończeniu tury.
  - **Wydajność:** jedna tekstura i jeden `Image` na scenę, ponowne malowanie tylko przy zmianie wyboru oraz co 120 ms dryfu.
  - **Dokumentacja:** ADR-031 i INTERF-005 opisują mgłę zasięgu wzroku.
