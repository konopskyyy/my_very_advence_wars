# Interfejs

| Kod        | Nazwa               | Opis                                                                             | Ukończone |
| ---------- | ------------------- | -------------------------------------------------------------------------------- | :-------: |
| INTERF-001 | Interfejs menu      | Menu główne gry z możliwością rozpoczęcia gry, wejścia w opcje i zamknięcia gry. |    [x]    |
| INTERF-002 | Pierwsze pole bitwy | Pole bitwy na siatce heksów z terenami i ruchomym czołgiem.                      |    [x]    |

### Ekran główny (menu)

Scena startowa gry — pierwsze, co widzi gracz po uruchomieniu.

- Przyciski: **Gra**, **Ustawienia**.
- **Gra** → przejście do sceny pola bitwy.
- **Ustawienia** → przejście do sceny/panelu ustawień (na razie pusty szkielet).
- **Krzyżyk (✕)** w prawym górnym rogu — zamknięcie gry; w wersji web brak okna,
  więc przycisk jest ukryty lub nieaktywny.

### Pole bitwy (heksy)

Cały ekran (480×270) pokryty siatką heksów pointy-top, bez czarnych pasów — plansza
startuje od lewej i górnej krawędzi.

- Współrzędne w układzie **doubled-width**: `q = 2·kolumna + (r & 1)`, `r = wiersz`.
  Parzyste wiersze mają `q = 0, 2, 4…`, nieparzyste `q = 1, 3, 5…`, więc parzystość
  `q` mówi wprost, w którym wierszu leży heks — szczegóły w [[ADR#ADR-003|ADR-003]].
- **Tereny**: równina, las, woda, góry, miasto. Woda i góry są **nieprzejezdne**.
- **Czołg** (placeholder do testów) stoi na równinie; podświetlane są heksy osiągalne
  w jednym ruchu, a kliknięcie sąsiada przesuwa jednostkę.
- Najechanie myszą podświetla heks (zielony = ruch dozwolony, czerwony = zablokowany)
  i pokazuje jego `q`, `r` oraz teren w lewym dolnym rogu.

Moduły (logika gry bez Phasera, zgodnie z [[ADR#ADR-001|ADR-001]]):

| Plik                     | Odpowiada za                                                         |
| ------------------------ | -------------------------------------------------------------------- |
| `core/hex.ts`            | model współrzędnych: sąsiedzi, odległość, zasięg, pierścienie         |
| `core/movement.ts`       | reguły ruchu (`canMoveTo`, tereny nieprzejezdne)                      |
| `core/terrain.ts`        | typy terenu (`Terrain`, `HexTile`) i kolory/ozdobniki                |
| `hexLayout.ts`           | geometria ekranu: `hexToPixel` / `pixelToHex`, rozmiar planszy, kafelki |
| `sampleMap.ts`           | deterministyczna mapa z regionów (`REGIONS`, `terrainAt`, `TANK_START`) |

Realizacja: [[Zadania#Gra\|GRA-001]]. Gałąź: `feat/main-menu-scene`.
