# Mapa heksagonalna

Dokument opisuje faktyczną implementację heksagonalnej mapy w kliencie. Opiera się na kodzie w `client/src/hexLayout.ts`, `client/src/core/hex.ts`, `client/src/scenes/BattlefieldScene.ts` i `client/src/sampleMap.ts`.

## Pliki odpowiedzialne

| Plik | Opis |
|---|---|
| `client/src/core/hex.ts` | Podstawowy typ `Hex { q, r }` oraz operacje na heksach (m.in. `hexNeighbors`). Logika nie zależy od Phasera (zgodne z ADR-001). |
| `client/src/hexLayout.ts` | Geometria heksów, stałe layoutu, konwersje `hexToPixel`/`pixelToHex`, wymiary planszy, generator `boardHexAt` oraz `isBoardHex` (czy heks należy do planszy). |
| `client/src/scenes/BattlefieldScene.ts` | Renderowanie mapy, obsługa kamery, hover, podświetlanie możliwych ruchów, poruszanie czołgiem. |
| `client/src/sampleMap.ts` | Przykładowe rozmieszczenie terenu (`terrainAt` — `undefined` poza planszą) oraz startowa pozycja czołgu (`TANK_START`). |
| `client/src/core/terrain.ts` | Typy terenu i kolory/art dla renderowania. |
| `client/src/core/movement.ts` | Reguły ruchu (`canMoveTo`) wykorzystywane przy podświetleniu i próbie ruchu. |

## Typ heksa

Używamy **axialnych** współrzędnych:

```ts
export interface Hex { q: number; r: number }
```

Nie ma oddzielnego typu offset poza przekształceniem wykorzystywanym przy budowie siatki.

## Geometria heksu (pointy-top)

Heksy są rysowane jako **pointy-top** (ostry wierzchołek skierowany ku górze).

Kluczowe stałe z `hexLayout.ts`:

| Stała | Wartość | Opis |
|---|---|---|
| `HEX_SIZE` | `16` | Promień do wierzchołka (od środka heksa do każdego z 6 wierzchołków). |
| `SQRT3` | `Math.sqrt(3)` | Potrzebne do obliczeń szerokości. |
| `HEX_WIDTH` | `SQRT3 * HEX_SIZE` | Szerokość heksa. |
| `COLUMN_STEP` | `HEX_WIDTH / 2` | Przyrost `q` w przeliczeniu na piksele. |
| `ROW_STEP` | `1.5 * HEX_SIZE` | Przyrost `r` w przeliczeniu na piksele. |
| `HEX_VERTICES` | tablica 6 par `[x,y]` | Wierzchołki wyliczone co 60° ze startem `-30°`: `angle = (Math.PI/180)*(60*i - 30)`. Dzięki temu pierwszy wierzchołek znajduje się u góry. |
| `HEX_ORIGIN_X` | `HEX_WIDTH / 2` | Przesunięcie całej mapy w osi X. |
| `HEX_ORIGIN_Y` | `HEX_SIZE` | Przesunięcie całej mapy w osi Y. |

Wierzchołki są dodatkowo delikatnie jitterowane przy rysowaniu w `BattlefieldScene`:

```ts
private vertices(hex: Hex, scale: number): readonly (readonly [number, number])[] {
  const jitter = 1 + ((hex.q * 7 + hex.r * 13) % 4) * 0.02;
  return HEX_VERTICES.map(([vx, vy]) => [vx * scale * jitter, vy * scale * jitter] as const);
}
```

Jitter jest wyłącznie wizualny (nie wpływa na współrzędne, kolizje ani ruch).

## Konwersja hex <-> piksel

### `hexToPixel({ q, r }: Hex)`
```ts
export function hexToPixel({ q, r }: Hex): { x: number; y: number } {
  return {
    x: HEX_ORIGIN_X + COLUMN_STEP * q,
    y: HEX_ORIGIN_Y + ROW_STEP * r,
  };
}
```

Wzór jest uproszczony pod konkretny layout używany przez tę mapę. Środek heksa o współrzędnych `(q,r)` trafia dokładnie w ten punkt.

### `pixelToHex(x: number, y: number)`
```ts
export function pixelToHex(x: number, y: number): Hex {
  const localY = y - HEX_ORIGIN_Y;
  const row = Math.round(localY / ROW_STEP);
  const column = Math.round((x - HEX_ORIGIN_X) / COLUMN_STEP);
  const q = column + (((column - row) % 2 + 2) % 2);
  return { q, r: row };
}
```

Konwersja w drugą stronę jest przybliżona (oparta o `Math.round`).

- `row` wyznaczany z `localY / ROW_STEP`
- `column` wyznaczany z `(x - HEX_ORIGIN_X) / COLUMN_STEP`
- `q` korygowany o wzór `column + (((column - row) % 2 + 2) % 2)` co kompensuje przesunięcia między rzędami

W praktyce wystarcza do wykrywania kliknięcia/hovera na aktualnej planszy, jednak nie jest to pełne, ogólne odwzorowanie dla dowolnego pointy-top layoutu - działa dla sposobu w jaki ta mapa jest wygenerowana.

## Generowanie planszy

### Rozmiary w jednostkach świata
```ts
export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 270;
```

### Ilość heksów
```ts
export const BOARD_ROWS = Math.ceil(BOARD_HEIGHT / ROW_STEP) + 1;
export const BOARD_COLUMNS = Math.ceil(BOARD_WIDTH / COLUMN_STEP) + 2;
```

Wartości są wyliczane na podstawie kroku layoutu, z niewielkim zapasem żeby pokryć obszar widoczny/świat.

### `boardHexAt(column: number, row: number)`
```ts
export function boardHexAt(column: number, row: number): Hex {
  return { q: 2 * column + (row & 1), r: row };
}
```

Dla każdego `(column, row)` z siatki tworzony jest `Hex`. Kluczowe:

- `r = row` (wiersz jest bezpośrednio mapowany na współrzędną `r`)
- `q = 2 * column + (row & 1)`

Dzięki temu **parzyste/nieparzyste wiersze** są przesunięte poziomo względem siebie (efekt "staggered"). Mnożenie przez 2 minimalizuje nakładanie się wartości `q` przy takim przesunięciu.

Cała płaska lista heksów dostępna jako `BOARD_TILES`.

### `isBoardHex(hex)`
```ts
export function isBoardHex({ q, r }: Hex): boolean {
  if (r < 0 || r >= BOARD_ROWS) return false;

  const column = (q - (r & 1)) / 2;
  return Number.isInteger(column) && column >= 0 && column < BOARD_COLUMNS;
}
```

Sprawdza, czy heks **w ogóle należy do planszy** — nie tylko czy ma poprawną
parzystość `q ≡ r (mod 2)`. Kolumna odtwarza się z `q` i parzystości wiersza,
więc heks spoza siatki (np. `q = -2`) daje kolumnę `-1` albo ułamek.

## Granice planszy a ruch

Mapa jest jedynym źródłem wiedzy o tym, które pola istnieją:

- `terrainAt(hex)` zwraca `Terrain | undefined` — `undefined` oznacza **heksa nie ma
  na planszy**.
- `canMoveTo(from, to, terrainAt)` w `core/movement.ts` odrzuca taki cel z powodem
  `out-of-bounds` (obok `not-adjacent` i `impassable`).

Dzięki temu reguła ruchu w rdzeniu nie zna rozmiarów planszy, a warstwa widoku nie
musi duplikować granic — to `terrainAt` jest jedynym miejscem, które decyduje, czy
pole istnieje. Typ `Terrain | undefined` zmusza każde miejsce wywołujące do
obsłużenia przypadku „pola nie ma”, a `tsc --noEmit` to wymusza (`TERRAIN_ART[terrain]`
przestaje się kompilować, gdy terenu może nie być).

Testy pilnujące tego, że czołg nie wychodzi z planszy: `client/src/boardBounds.test.ts`
(spacer losowy + wszystkie krawędzie) oraz `client/src/core/movement.bounds.test.ts`
(zasady rdzenia).

## Renderowanie (BattlefieldScene)

Obecnie mapa jest renderowana **proceduralnie** przy użyciu `Phaser.GameObjects.Graphics`. Istnieje jednak możliwość podmiany na gotowe kafelki/sprite'y (patrz sekcja poniżej).

1. `drawTiles()` pobiera `boardTiles()` (wszystkie heksy z zakresu `BOARD_COLUMNS x BOARD_ROWS`) i rysuje:
   - wypełnienie kolorem terenu z `TERRAIN_ART[terrainAt(hex)].color`
   - obrys czarny z przezroczystością
   - detale (`drawDetail`) - kolorowe kropki w zależności od `q,r`
   - glify terenu (`drawTerrainGlyph`) dla lasu/gór
   - znaczniki miast (`drawCityMark`) dla `Terrain.City`

2. `hexPoints(hex)` / `innerPoints(hex, scale)` zamienia współrzędne heksa na listę `Phaser.Math.Vector2` używając `hexToPixel` + `vertices`.

3. Warstwy:
   - tło/heksy rysowane przez `Graphics` (bez interakcji)
   - `hoverLayer` - obrys heksa pod kursorem
   - `reachableLayer` - półprzezroczyste wypełnienie dla sąsiadów, do których można wejść
   - `tank` - `Container` z głębokością `10`

## Interakcja

- `pointermove` -> `pixelToHex(pointer.worldX, pointer.worldY)` -> `updateHover(hex)`
- `pointerdown` -> `pixelToHex(pointer.worldX, pointer.worldY)` -> `tryMove(hex)`

`updateHover`:
- pokazuje `q,r` i nazwę terenu w `coordText` (albo „poza planszą", gdy heksa nie istnieje)
- rysuje obrys na `hoverLayer`. Kolor zależy od `canMoveTo(tankPosition, hex, terrainAt).ok` (zielonkawy jeśli ruch dozwolony)

`refreshReachable`:
- iteruje po `hexNeighbors(tankPosition)`
- filtruje przez `canMoveTo`
- rysuje wypełnienie+obrys na `reachableLayer`

`tryMove`:
- sprawdza `canMoveTo` - jeśli OK ustawia `tankPosition`, przenosi czołg (`moveTankTo` używa `hexToPixel`), odświeża podświetlenie możliwych ruchów i hover

## Kamera i przewijanie krawędziowe

W `BattlefieldScene` dodano:

- `setupCameraBounds()` - oblicza bounding box wszystkich heksów (z paddingiem `HEX_SIZE + 32`) i woła `setBounds` + `centerOn`
- `update(time, delta)` - gdy kursor jest bliżej niż `edgeMargin = 24` od krawędzi canvas, kamera przesuwa się z prędkością `420 * delta/1000`. UI ma `setScrollFactor(0)`, więc nie przesuwa się razem z kamerą.

## Szybkie podsumowanie

- **Układ**: pointy-top, axial `(q,r)`, siatka budowana przez `boardHexAt` z przesunięciem rzędów
- **Pozycjonowanie**: `hexToPixel` = `origin + (COLUMN_STEP*q, ROW_STEP*r)`
- **Kliknięcie**: `pixelToHex` z `round` + korekta dla staggeru
- **Render**: Phaser Graphics, wierzchołki jitterowane wyłącznie wizualnie
- **Ruch**: sprawdzany przez `canMoveTo` w `core/movement.ts`, podświetlany sąsiedzi; cel poza planszą odrzucany z powodem `out-of-bounds`

## Przygotowanie kafelków (tilesety) pod hexy

W obecnym kodzie mapa jest rysowana przez `Phaser.GameObjects.Graphics` (wielokąty). Jeśli chcesz przejść na własne grafiki (np. z edytora), należy pamiętać o dopasowaniu do tego layoutu.

### Wymiary pod ten layout (pointy-top)

Dla `HEX_SIZE = 16`:

| Wartość | Obliczenie | Przybliżenie |
| --- | --- | --- |
| `HEX_WIDTH` | `sqrt(3) * HEX_SIZE` | ~27.71 |
| Wysokość heksa (wierzchołek-wierzchołek) | `2 * HEX_SIZE` | 32 |
| Odległość między płaskimi bokami | `sqrt(3) * HEX_SIZE` | ~27.71 |

Dla kafelków najlepiej przygotować **pointy-top hex** w przezroczystym prostokącie. Typowe rozmiary to `28x32`, `32x32`, `48x48`, `64x64` (potęgi 2).

### Jak przygotować

- **Kształt:** pointy-top (ostry wierzchołek na górze). Narożniki poza sześciokątem muszą być przezroczyste.
- **Centrowanie:** grafika wyśrodkowana względem środka heksa.
- **Podejście A (osobne kafelki):** `hex_grass.png`, `hex_forest.png`, `hex_water.png`, `hex_mountain.png`, `hex_city.png` itd.
- **Podejście B (atlas/tileset):** jeden plik z klatkami dla różnych terenów (np. TexturePacker). Wystarczy potem wybrać klatkę na podstawie `terrainAt(hex)`.

### Renderowanie jako sprite'y (Image)

Ponieważ pozycjonowanie jest oparte o `hexToPixel`, najbezpieczniej używać `Phaser.GameObjects.Image` wyśrodkowanego na środku heksa.

```ts
preload(): void {
  this.load.image('hex_grass', 'assets/tiles/hex_grass.png');
  this.load.image('hex_forest', 'assets/tiles/hex_forest.png');
  this.load.image('hex_water', 'assets/tiles/hex_water.png');
  this.load.image('hex_mountain', 'assets/tiles/hex_mountain.png');
  this.load.image('hex_city', 'assets/tiles/hex_city.png');
}

private drawTiles(): void {
  const tiles = this.boardTiles();

  for (const hex of tiles) {
    const { x, y } = hexToPixel(hex);
    const terrain = terrainAt(hex);
    const key = this.getTileKey(terrain);

    this.add.image(x, y, key).setOrigin(0.5, 0.5);
  }
}

private getTileKey(terrain: Terrain): string {
  switch (terrain) {
    case Terrain.Water: return 'hex_water';
    case Terrain.Forest: return 'hex_forest';
    case Terrain.Mountain: return 'hex_mountain';
    case Terrain.City: return 'hex_city';
    case Terrain.Plains:
    default: return 'hex_grass';
  }
}
```

Wskazówki:
- **Zawsze `setOrigin(0.5, 0.5)`** - `hexToPixel` zwraca środek heksa.
- **Nie jitteruj pozycji sprite'ów.** Obecny `vertices()` dodaje tylko wizualny jitter do wielokąta - przy obrazkach musisz trzymać pozycję dokładnie w `(x,y) = hexToPixel(hex)`, inaczej zepsujesz `pixelToHex`/kliknięcia/hover.
- **Sortowanie po Y** może być przydatne gdy dodasz wyższe obiekty (jednostki/budynki), choć dla samej płaskiej mapy zwykle niekonieczne.
- **Phaser Tilemap** - teoretycznie możliwy, jednak `pixelToHex`, `boardHexAt` i customowe przeliczenia są dopasowane pod ten projekt. Ręczne `Image` per heks jest prostsze i mniej ryzykowne.

## Grafika wektorowa (SVG)

Tak, **może być**. W Phaserze SVG ładowany przez `this.load.svg()` zostanie **zrasteryzowany** na teksturę przy wczytywaniu - nie renderowany jako żywy SVG w DOM.

### Ładowanie

```ts
preload(): void {
  this.load.svg('hex_grass', 'assets/tiles/hex_grass.svg', { width: 32, height: 32 });
  this.load.svg('hex_forest', 'assets/tiles/hex_forest.svg', { width: 32, height: 32 });
}
```

Możesz podać `width`/`height` żeby wymusić docelowy rozmiar rasteryzacji. Plik SVG musi mieć przezroczyste narożniki (shape pointy-top) i być wycentrowany względem środka.

### Renderowanie

Dokładnie jak powyżej - używaj `Image` z `origin(0.5, 0.5)`. Działanie jest identyczne jak PNG, jedynie źródło pliku się zmienia.

### Maska przy nieidealnym kształcie

Jeśli SVG/rysunek nie pokrywa idealnie heksowego kształtu, można przyciąć go maską na podstawie istniejących punktów:

```ts
const poly = this.hexPoints(hex);
const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
maskGfx.fillStyle(0xffffff).fillPoints(poly, true);
const mask = maskGfx.createGeometryMask();
img.setMask(mask);
```

### Porady
- **Najbezpieczniej testować na jednym kafelku.** Zamień tylko jeden typ terenu na SVG, sprawdź czy hover/kliknięcia nadal działają.
- **Trzymaj zgodność z hit-testingiem.** `hexToPixel` + `origin(0.5,0.5)` musi pozostać dokładne.
- **Graphics vs SVG.** Obecne rozwiązanie oparte o `Graphics` jest szybkie, nie wymaga assetów, łatwo zmienia kolory/efekty i idealnie pasuje do logiki. SVG ma sens gdy chcesz ręcznie malowane, ozdobne kafelki.

## Uwagi przy modyfikacjach

- Zmiana `HEX_SIZE`/kroków wpłynie na `hexToPixel`, `pixelToHex`, wymiary planszy i kamerę - sprawdź wszystkie miejsca.
- `pixelToHex` jest uproszczony - przy nietypowym powiększeniu/skalowaniu sceny lepiej upewnić się, że używamy współrzędnych świata (`pointer.worldX/Y`), co aktualnie ma miejsce.
- Jitter nie może trafić do logiki gry (ruch/AI) - tylko do `vertices()`.
- `boardHexAt` łączy siatkę kolumn/wierszy z axialnymi współrzędnymi - przy rozbudowie mapy warto to mieć na uwadze by nie mieszać z innym offset layoutem.
- Nowa mapa musi oddawać `undefined` z `terrainAt` dla pól, których nie ma - inaczej czołg znów wyjdzie poza planszę.
