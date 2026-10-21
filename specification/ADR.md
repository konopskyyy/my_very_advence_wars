# ADR — Architecture Decision Records

Krótkie, numerowane zapisy decyzji projektowych (kontekst → decyzja → konsekwencje).
Każdy ADR jest domyślnie zwinięty — kliknij nagłówek, aby rozwinąć.

Legenda statusów: **✅ Zaakceptowane**, `Otwarte`, `Proponowane`, `Odrzucone`, `Zastąpione`.

---

> [!success]- ✅ ADR-001: Stack technologiczny — TypeScript + Phaser + Electron (web + PC)
> **Status:** ✅ Zaakceptowane · **Data:** 2026-10-19
>
> #### Kontekst
> Pierwotnie zakładaliśmy **Godot 4.7 + C# (.NET)** wyłącznie na PC (wcześniejsza
> wersja tego ADR). Priorytety się zmieniły: chcemy **łatwo udostępniać grę w sieci**
> oraz **budować na PC z tego samego kodu**, a przede wszystkim pracować **code-first**
> — z agentem AI generującym kod, przy minimum klikania w GUI edytora.
>
> Dwie cechy Godota stoją w sprzeczności z tym celem:
> - **C# nie eksportuje się na web** w Godocie 4 — web wypada przy zachowaniu .NET.
> - Godot jest **GUI-centryczny** (sceny, tilemapy, animacje, UI robi się w edytorze),
>   co słabo pasuje do pracy, w której kod generuje agent.
>
> #### Decyzja
> Klient gry: **TypeScript + Phaser + Vite**.
> Dystrybucja: **web (deploy)** oraz **PC przez Electron** — z **jednego bundle'a**.
>
> Zasady architektoniczne:
> - Cała logika gry w module `core/` **bez zależności od Phasera** (czysty TS) —
>   dla testowalności (Vitest) i możliwego przyszłego portu na inny silnik.
> - Mapy jako **JSON** (schemat walidowany Zodem), edytor map **wbudowany w klienta**.
> - Gra działa **offline (local-first)**; sejwy lokalnie (web: IndexedDB, Electron: plik).
> - Backend (konta, osiągnięcia, sejwy w chmurze) — **odłożony**; docelowo **Symfony**.
>
> #### Konsekwencje
> - Porzucamy Godota, C# i .NET; obecny projekt (`project.godot`, `.csproj`, `scenes/`,
>   `scripts/`) zostaje usunięty z repo.
> - Electron **nie jest silnikiem** — sceny, tilemapy, animacje i UI bierzemy z Phasera
>   lub piszemy sami. Build Electron waży ok. 150–250 MB.
> - Dzięki czystemu `core/` ewentualny **port na Godota w przyszłości** oznacza
>   przepisanie tylko warstwy widoku, nie całej logiki.
> - Dwa artefakty z jednego kodu: build web i build Electron.
>
> #### Odrzucone opcje
> - **Godot + C#** — brak eksportu na web przy .NET; GUI-centryczny, słaby fit do
>   pracy code-first z agentem.
> - **Godot + GDScript** — pełne wsparcie web + PC, ale GUI-centryczny i rezygnacja
>   z ekosystemu JS/Vite; odrzucone na rzecz pracy code-first.
> - **PHP uruchamiane lokalnie w Electronie** — niepotrzebna złożoność (bundlowanie
>   runtime PHP, lokalny serwer HTTP); backend zostaje po stronie serwera.
>
> #### Uwaga
> Ten ADR **odwraca** wcześniejszą decyzję o PC-only + C#. Ponieważ **kod nie został
> jeszcze napisany**, decyzję zmieniamy w miejscu, bez zachowywania historii.

> [!warning]- ADR-002: Styl grafiki — pixel art vs wektor
> **Status:** `Otwarte` (wymaga rozstrzygnięcia) · **Data:** 2026-10-11
>
> #### Kontekst
> Gra jest taktyczna, turowa, na siatce — w duchu *Advance Wars*. Kluczowa jest
> czytelność jednostek „na pierwszy rzut oka” (sylwetka + kolor + ikona) oraz
> spójny język wizualny całej mapy. Obsługiwane platformy: PC + Web (wysokie
> rozdzielczości, potencjalnie też mniejsze ekrany).
>
> #### Rozważane opcje
>
> **A. Pixel art (retro, jak Advance Wars)**
> - Plusy: naturalnie pasuje do gatunku; dużo referencji; łatwa animacja klatka po
>   klatce; świetne wsparcie w Phaserze (`pixelArt: true`, filtr `nearest`).
> - Minusy: trzeba zamrozić rozdzielczość bazową (np. 480×270) i skalować całkowicie;
>   każdy wariant frakcji i animacja to ręczna praca.
>
> **B. Wektor / 2D HD**
> - Plusy: ostrość w każdej rozdzielczości; łatwe recolory frakcji; skalowanie;
>   animacje przez Tween / `AnimatedSprite`; mniej powtarzalnej pracy.
> - Minusy: ryzyko sterylnego „flashowego” looku; animacja szkieletowa wymaga riggow;
>   SVG i tak importuje się jako raster.
>
> #### Wstępna rekomendacja
> Pixel art na ustalonej rozdzielczości bazowej — najbliżej gatunku i najprostszy
> technicznie. Wektor sensowny, jeśli priorytetem są skalowalność i szybkie
> dodawanie jednostek/frakcji.
>
> #### Do rozstrzygnięcia
> - [ ] Styl: pixel art (A) czy wektor/2D HD (B)?
> - [ ] Bazowa rozdzielczość / grid kafelków (jeśli pixel art).

> [!success]- ✅ ADR-003: Siatka heksów — współrzędne doubled-width (q parzyste/nieparzyste)
> **Status:** `Zaakceptowane` · **Data:** 2026-10-20
>
> #### Kontekst
> Pole bitwy to siatka heksów w rzucie „pointy-top” (heksy płaskie u góry, kolumny
> pionowe). Potrzebujemy modelu współrzędnych, który: (1) daje jednoznaczne klucze do
> kafelków i ruchu jednostek, (2) pozwala liczyć sąsiadów i odległość bez błędów
> zaokrągleń, (3) czyta się naturalnie „od lewej” przy numeracji kolumn, tak by dało
> się powiedzieć, że heks o nieparzystym `q` leży między heksami z wiersza wyżej.
>
> #### Rozważane opcje
> **A. Axial (q, r) punktowe**
> - Plusy: kanoniczny model, proste `hexNeighbors` i `hexDistance` (kostka + odrzucenie
>   największej różnicy).
> - Minusy: numeracja nie mapuje się wprost na kolumny ekranu, więc wyświetlanie i
>   „liczenie od lewej” wymaga dodatkowej konwersji offset→axial.
>
> **B. Offset (kolumna, wiersz)**
> - Plusy: numeracja 1:1 z ekranem, trywialne do wypisania w UI.
> - Minusy: `q` i `r` **nie są** współrzędnymi heksowymi — sąsiedzi i odległość wymagają
>   osobnych funkcji z rozgałęzieniami na parzystość wiersza; łatwo o „duchy” heksów.
>
> **C. Doubled-width (2×kolumna, wiersz)** — wybrane
> - `q = 2 · kolumna + (r & 1)`, `r = wiersz`. Parzyste wiersze mają `q = 0, 2, 4…`,
>   nieparzyste `q = 1, 3, 5…`, więc **parzystość `q` mówi wprost, w którym wierszu
>   leży heks** (`q=3` leży między `q=2` i `q=4` z wiersza wyżej).
> - Plusy: jeden spójny model — sąsiedzi to stałe kierunki (`±2` w wierszu, `±1` po
>   skosie), `hexDistance` to zamknięty wzór `dr + max(0, (dq − dr)/2)`, a numeracja
>   czyta się od lewej. Kolumny stoją w pionowych „szynach”.
> - Minusy: obowiązuje niezmiennik `q ≡ r (mod 2)` — heks o złej parzystości nie
>   istnieje, więc `hexesInRange` musi filtrować kandydatów po tej parzystości.
>
> #### Decyzja
> Model **doubled-width**. Geometria ekranu: `HEX_SIZE = 16`, krok kolumny
> `√3·size/2`, krok wiersza `1.5·size`. Lewa i górna krawędź planszy startują od 0.
> Ruch jednostki to **jedno pole (sąsiad)**, a woda i góry są nieprzejezdne
> (`core/movement.ts`). Mapa generowana deterministycznie z listy regionów
> (środek + promień) w `sampleMap.ts` — bez losowości, więc testy są stabilne.
>
> #### Konsekwencje
> - Wszystkie stałe geometryczne i konwersje `hexToPixel`/`pixelToHex` mieszkają w
>   `client/src/hexLayout.ts`; logika heksowa w `client/src/core/hex.ts` (bez Phasera,
>   zgodnie z [[ADR#ADR-001|ADR-001]]).
> - Dodawanie heksów i regionów mapy musi pilnować parzystości `q`.


