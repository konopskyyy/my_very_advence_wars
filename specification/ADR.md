# ADR — Architecture Decision Records

Krótkie, numerowane zapisy decyzji projektowych (kontekst → decyzja → konsekwencje).
Każdy ADR jest domyślnie zwinięty — kliknij nagłówek, aby rozwinąć.

Legenda statusów: **✅ Zaakceptowane**, `Otwarte`, `Proponowane`, `Odrzucone`, `Zastąpione`.

---

> [!failure]- ADR-001: Docelowa platforma — tylko PC, C# (.NET), bez webu
> **Status:** `Zastąpione` (przez ADR-003) · **Data:** 2026-10-11
>
> #### Kontekst
> Rozważaliśmy wydanie gry na **PC (Windows/Linux) oraz w przeglądarce (Web)**.
>
> Silnik: Godot 4.7. Eksport web wymaga WebAssembly i WebGL 2.0, czyli renderera
> **Compatibility** (`gl_compatibility`) — ten jest już ustawiony w `project.godot`.
>
> Kluczowe ograniczenie: **projektów pisanych w C# (.NET) nie można obecnie eksportować
> na web w Godot 4** (potwierdzone w oficjalnej dokumentacji „Exporting for the Web”).
> Obecny projekt ma włączony `.NET` (`[dotnet] assembly_name`), czyli jest w konflikcie
> z celem „web”.
>
> #### Decyzja
> Zostajemy przy **C# (.NET)**. Platforma docelowa: **wyłącznie PC (Windows/Linux)**.
> **Rezygnujemy z eksportu na web.**
>
> #### Konsekwencje
> - Web wypada jako cel — nie ograniczamy się do tego, co potrafi web.
> - Renderer: obecnie `gl_compatibility`; to wystarcza dla 2D. Ewentualne przejście na
>   `Forward+` nie jest wymagane i może poczekać.
> - Odwrócenie decyzji (jeśli web kiedyś stanie się wymagany) oznacza przepisanie
>   logiki na GDScript.
>
> #### Odrzucone opcje
> - **GDScript + web** — pełne wsparcie PC + Web, ale kosztem rezygnacji z C#;
>   odrzucone, bo priorytetem jest .NET.
> - **C# + web „obejściem”** — duża złożoność i ryzyko, niepolecane.

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
>   klatce; świetne wsparcie w Godocie (`texture_filter = nearest`, pixel snap).
> - Minusy: trzeba zamrozić rozdzielczość bazową (np. 480×270) i skalować całkowicie;
>   każdy wariant frakcji i animacja to ręczna praca.
>
> **B. Wektor / 2D HD**
> - Plusy: ostrość w każdej rozdzielczości; łatwe recolory frakcji; skalowanie;
>   animacje przez Tween / `Skeleton2D`; mniej powtarzalnej pracy.
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

> [!success]- ✅ ADR-003: Powrót do GDScript i wsparcie web
> **Status:** ✅ Zaakceptowane · **Data:** 2026-10-13
>
> #### Kontekst
> Chcemy, aby gra działała również **w przeglądarce (web)**. Eksport web w Godot 4
> wymaga WebAssembly i WebGL 2.0 (renderer `gl_compatibility`). Projektów w C#
> (.NET) nie można eksportować na web, więc dotychczasowa decyzja (ADR-001)
> blokowała ten cel.
>
> #### Decyzja
> Przepisujemy logikę gry z **C# na GDScript** i usuwamy zależność od .NET.
> Platformy docelowe: **PC (Windows/Linux) oraz web**.
>
> #### Konsekwencje
> - Wsparcie web staje się możliwe (WASM + WebGL 2.0).
> - Usunięte: `my_very_advance_wars.csproj`, `my_very_advance_wars.sln`,
>   `scripts/Main.cs` oraz sekcja `[dotnet]` w `project.godot`.
> - Renderer pozostaje `gl_compatibility` (wymagany dla web; wystarcza dla 2D).
> - Tracimy statyczne typowanie i ekosystem .NET na rzecz GDScript.
>
> #### Odrzucone opcje
> - **Pozostanie przy C#** — wyklucza web (patrz ADR-001).
> - **Dwa równoległe backendy (C# + GDScript)** — podwójne utrzymanie logiki gry.

> [!abstract]- Backlog / planowane ADR
> Kolejne decyzje do podjęcia (kolejność orientacyjna). Numer nadajemy w momencie
> rozstrzygnięcia.
>
> | #       | Temat                        | Czego dotyczy                                                                      |
> | ------- | ---------------------------- | ---------------------------------------------------------------------------------- |
> | ADR-004 | Struktura katalogów projektu | `scenes/`, `scripts/`, `assets/`, `resources/` — układ type-based vs feature-based |
> | ADR-005 | Organizacja scen i skryptów  | konwencja wiązania sceny ze skryptem GDScript, sceny jako prefaby/reużywalne komponenty |
> | ADR-006 | Autoloady / singletony       | `GameState`, `EventBus`, `Config`, zarządzanie scenami                             |
> | ADR-007 | UI i rozdzielczość           | `Control` vs `Node2D`, Theme, skalowanie przy różnych rozdzielczościach            |
> | ADR-008 | Konwencje kodu i nazewnictwa | nazwy plików/klas, styl GDScript                                                   |
