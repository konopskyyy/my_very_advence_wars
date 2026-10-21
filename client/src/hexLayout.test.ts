import { describe, expect, it } from 'vitest';
import {
  BOARD_COLUMNS,
  BOARD_HEIGHT,
  BOARD_ROWS,
  BOARD_TILES,
  BOARD_WIDTH,
  COLUMN_STEP,
  HEX_SIZE,
  boardHexAt,
  hexToPixel,
  pixelToHex,
} from './hexLayout';
import { hexDistance, hexNeighbors } from './core/hex';

const HEX_WIDTH = COLUMN_STEP * 2;

describe('boardHexAt', () => {
  it('parzyste wiersze mają q = 0, 2, 4…, nieparzyste q = 1, 3, 5…', () => {
    expect(boardHexAt(0, 0)).toEqual({ q: 0, r: 0 });
    expect(boardHexAt(1, 0)).toEqual({ q: 2, r: 0 });
    expect(boardHexAt(0, 1)).toEqual({ q: 1, r: 1 });
    expect(boardHexAt(1, 1)).toEqual({ q: 3, r: 1 });
    expect(boardHexAt(2, 3)).toEqual({ q: 5, r: 3 });
  });

  it('parzystość q zawsze zgadza się z parzystością r', () => {
    for (const hex of BOARD_TILES) {
      expect(((hex.q - hex.r) % 2 + 2) % 2).toBe(0);
    }
  });
});

describe('geometria heksów', () => {
  it('wszyscy sześciu sąsiadów jest w tej samej odległości (HEX_WIDTH)', () => {
    const center = { q: 4, r: 2 };
    const origin = hexToPixel(center);

    for (const neighbor of hexNeighbors(center)) {
      const { x, y } = hexToPixel(neighbor);
      expect(Math.hypot(x - origin.x, y - origin.y)).toBeCloseTo(HEX_WIDTH, 5);
    }
  });

  it('kolejne kolumny w wierszu są od siebie o HEX_WIDTH', () => {
    const a = hexToPixel(boardHexAt(0, 0));
    const b = hexToPixel(boardHexAt(1, 0));
    expect(b.x - a.x).toBeCloseTo(HEX_WIDTH, 5);
  });
});

describe('pixelToHex', () => {
  it('środek każdego widocznego kafelka trafia w ten sam heks', () => {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let column = 0; column < BOARD_COLUMNS; column++) {
        const hex = boardHexAt(column, row);
        const { x, y } = hexToPixel(hex);
        const inside =
          x - HEX_WIDTH / 2 >= 0 &&
          x + HEX_WIDTH / 2 <= BOARD_WIDTH &&
          y - HEX_SIZE >= 0 &&
          y + HEX_SIZE <= BOARD_HEIGHT;
        if (!inside) continue;

        expect(pixelToHex(x, y)).toEqual(hex);
      }
    }
  });
});

describe('pokrycie planszy', () => {
  it('plansza zaczyna się dokładnie na lewej krawędzi', () => {
    const minX = Math.min(...BOARD_TILES.map((hex) => hexToPixel(hex).x - HEX_WIDTH / 2));
    expect(minX).toBe(0);
  });

  it('żaden heks nie ma ujemnego r, a q rośnie od lewej', () => {
    for (const hex of BOARD_TILES) {
      expect(hex.r).toBeGreaterThanOrEqual(0);
      expect(hex.q).toBeGreaterThanOrEqual(0);
    }
  });

  it('sąsiad w pionie jest dokładnie o 1 bliżej niż heks w tym samym wierszu, dwie kolumny stąd', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 1 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 4, r: 0 })).toBe(2);
  });
});
