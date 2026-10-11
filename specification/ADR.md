# ADR — Architecture Decision Records

Krótkie, numerowane zapisy decyzji projektowych (kontekst → decyzja → konsekwencje).
Statusy: `Otwarte`, `Proponowane`, `Zaakceptowane`, `Odrzucone`, `Zastąpione`.

---

## ADR-001: Docelowa platforma — tylko PC, C# (.NET), bez webu

- **Status:** Zaakceptowane
- **Data:** 2026-10-11

### Kontekst
Rozważaliśmy wydanie gry na **PC (Windows/Linux) oraz w przeglądarce (Web)**.

Silnik: Godot 4.7. Eksport web wymaga WebAssembly i WebGL 2.0, czyli renderera
**Compatibility** (`gl_compatibility`) — ten jest już ustawiony w `project.godot`.

Kluczowe ograniczenie: **projektów pisanych w C# (.NET) nie można obecnie eksportować
na web w Godot 4** (potwierdzone w oficjalnej dokumentacji „Exporting for the Web”).
Obecny projekt ma włączony `.NET` (`[dotnet] assembly_name`), czyli jest w konflikcie
z celem „web”.

### Decyzja
Zostajemy przy **C# (.NET)**. Platforma docelowa: **wyłącznie PC (Windows/Linux)**.
**Rezygnujemy z eksportu na web.**

### Konsekwencje
- Web wypada jako cel — nie ograniczamy się do tego, co potrafi web.
- Renderer: obecnie `gl_compatibility`; to wystarcza dla 2D. Ewentualne przejście na
  `Forward+` nie jest wymagane i może poczekać.
- Odwrócenie decyzji (jeśli web kiedyś stanie się wymagany) oznacza przepisanie
  logiki na GDScript.

### Odrzucone opcje
- **GDScript + web** — pełne wsparcie PC + Web, ale kosztem rezygnacji z C#;
  odrzucone, bo priorytetem jest .NET.
- **C# + web „obejściem”** — duża złożoność i ryzyko, niepolecane.

---

## ADR-002: Styl grafiki — pixel art vs wektor

- **Status:** Otwarte (wymaga rozstrzygnięcia)
- **Data:** 2026-10-11

### Kontekst
Gra jest taktyczna, turowa, na siatce — w duchu *Advance Wars*. Kluczowa jest
czytelność jednostek „na pierwszy rzut oka” (sylwetka + kolor + ikona) oraz
spójny język wizualny całej mapy. Obsługiwane platformy: PC + Web (wysokie
rozdzielczości, potencjalnie też mniejsze ekrany).

### Rozważane opcje

**A. Pixel art (retro, jak Advance Wars)**
- Plusy: naturalnie pasuje do gatunku; dużo referencji; łatwa animacja klatka po
  klatce; świetne wsparcie w Godocie (`texture_filter = nearest`, pixel snap).
- Minusy: trzeba zamrozić rozdzielczość bazową (np. 480×270) i skalować całkowicie;
  każdy wariant frakcji i animacja to ręczna praca.

**B. Wektor / 2D HD**
- Plusy: ostrość w każdej rozdzielczości; łatwe recolory frakcji; skalowanie;
  animacje przez Tween / `Skeleton2D`; mniej powtarzalnej pracy.
- Minusy: ryzyko sterylnego „flashowego” looku; animacja szkieletowa wymaga riggow;
  SVG i tak importuje się jako raster.

### Wstępna rekomendacja
Pixel art na ustalonej rozdzielczości bazowej — najbliżej gatunku i najprostszy
technicznie. Wektor sensowny, jeśli priorytetem są skalowalność i szybkie
dodawanie jednostek/frakcji.

### Do rozstrzygnięcia
- [ ] Styl: pixel art (A) czy wektor/2D HD (B)?
- [ ] Bazowa rozdzielczość / grid kafelków (jeśli pixel art).

---

## Backlog / planowane ADR

Kolejne decyzje do podjęcia (kolejność orientacyjna). Numer nadajemy w momencie
rozstrzygnięcia.

| # | Temat | Czego dotyczy |
| --- | --- | --- |
| ADR-003 | Struktura katalogów projektu | `scenes/`, `scripts/`, `assets/`, `resources/` — układ type-based vs feature-based |
| ADR-004 | Organizacja scen i skryptów | konwencja wiązania sceny ze skryptem C#, sceny jako prefaby/reużywalne komponenty |
| ADR-005 | Dane jednostek (data-driven) | `Resource` / JSON / klasy C# dla jednostek, terenu, CO |
| ADR-006 | Autoloady / singletony | `GameState`, `EventBus`, `Config`, zarządzanie scenami |
| ADR-007 | Pętla gry i model tur | maszyna stanów: tura, faza ruchu/akcji, koniec gry |
| ADR-008 | Zapis stanu gry | `user://`, format (JSON/binarny), co zapisujemy |
| ADR-009 | UI i rozdzielczość | `Control` vs `Node2D`, Theme, skalowanie przy różnych rozdzielczościach |
| ADR-010 | Konwencje kodu i nazewnictwa | nazwy plików/klas, namespace, styl C# |
