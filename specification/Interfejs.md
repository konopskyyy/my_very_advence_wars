# Interfejs

## INTERF-001: Menu główne
- **Status:** Zaimplementowane
- **Opis:** Ekran startowy z opcjami „Edytor map” i „Pole bitwy”.
- **Pliki:** `client/src/scenes/MenuScene.ts`, `client/src/main.ts`

## INTERF-002: Pole bitwy
- **Status:** Częściowo zaimplementowane
- **Opis:** Podgląd pola bitwy na siatce heksagonalnej (placeholder). Z pola bitwy można przejść do edytora mapy klawiszem `E`.
- **Pliki:** `client/src/scenes/BattlefieldScene.ts`, `client/src/view/hexGrid.ts`

## INTERF-003: Edytor map
- **Status:** Zaimplementowane
- **Opis:** Edytor map na siatce heksagonalnej. Służy do **malowania terenu** mapy (nie do stawiania jednostek).
- **Teren:** łąka (1), las (2), woda (3), góry (4), bagno (5), droga (6), miasto (7).
- **Obsługa:**
  - LPM — maluje wybranym pędzlem (można ciągnąć),
  - PPM — usuwa kafelek (wraca czarne tło),
  - `1`–`7` — wybór pędzla terenu,
  - `X` — czyści mapę (zostaje czarne tło),
  - strzałki / `WASD` — przesuwanie kamery, środkowy przycisk — przeciąganie,
  - kółko myszy — zoom,
  - `B` — pole bitwy, `ESC` — menu.
- **Mapa to zbiór kafelków**, nie prostokąt: można malować **poza pierwotnym prostokątem** — na czarnym tle. Współrzędne heksów są absolutne, więc kafelki mogą leżeć także po osi `0` (ujemne `col`/`row`). Zasięg kamery rośnie razem z mapą.
- **Pliki:** `client/src/scenes/MapEditorScene.ts`, `client/src/view/hexGrid.ts`, `client/src/core/hex.ts`, `client/src/core/terrain.ts`, `client/src/core/map.ts`
