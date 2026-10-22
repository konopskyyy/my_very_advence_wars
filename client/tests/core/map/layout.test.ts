import { describe, expect, it } from 'vitest';
import {
  fromAxial,
  fromDoubled,
  hexDistance,
  hexNeighbors,
  hexToPixel,
  pixelToHex,
  toAxial,
  toDoubled,
} from '../../../src/core/map/layout';

describe('konwersje współrzędnych', () => {
  it('zachowuje koordynaty w obie strony', () => {
    const coords = [
      { col: 0, row: 0 },
      { col: 3, row: 4 },
      { col: 7, row: 1 },
      { col: 2, row: 9 },
    ];

    for (const coord of coords) {
      expect(fromAxial(toAxial(coord))).toEqual(coord);
    }
  });

  it('zachowuje ujemne współrzędne', () => {
    const coords = [
      { col: -1, row: 0 },
      { col: -4, row: -1 },
      { col: 2, row: -3 },
      { col: -6, row: -5 },
    ];

    for (const coord of coords) {
      expect(fromAxial(toAxial(coord))).toEqual(coord);
    }
  });
});

describe('kolumna podwojona', () => {
  it('liczy kolumnę jako 2q + r', () => {
    expect(toDoubled({ col: 0, row: 0 }).col).toBe(0);
    expect(toDoubled({ col: 3, row: 0 }).col).toBe(6);
    expect(toDoubled({ col: 3, row: 1 }).col).toBe(7);
    expect(toDoubled({ col: 3, row: 2 }).col).toBe(6);
  });

  it('sąsiednie hexy w wierszu różnią się o 2', () => {
    for (const row of [0, 1, 2, 3]) {
      const left = toDoubled({ col: 4, row }).col;
      const right = toDoubled({ col: 5, row }).col;

      expect(right - left).toBe(2);
    }
  });

  it('parzystość kolumny zdradza parzystość wiersza', () => {
    for (const row of [0, 1, 2, 3, -1, -2]) {
      expect(toDoubled({ col: 4, row }).col % 2).toBe(Math.abs(row) % 2);
    }
  });

  it('zachowuje koordynaty w obie strony', () => {
    const coords = [
      { col: 0, row: 0 },
      { col: 3, row: 4 },
      { col: 7, row: 1 },
      { col: -2, row: -1 },
      { col: -6, row: -5 },
    ];

    for (const coord of coords) {
      expect(fromDoubled(toDoubled(coord))).toEqual(coord);
    }
  });
});

describe('hexDistance', () => {
  it('liczy odległość między heksam', () => {
    expect(hexDistance({ col: 0, row: 0 }, { col: 0, row: 0 })).toBe(0);
    expect(hexDistance({ col: 0, row: 0 }, { col: 3, row: 0 })).toBe(3);
    expect(hexDistance({ col: 0, row: 0 }, { col: 0, row: 2 })).toBe(2);
    expect(hexDistance({ col: 2, row: 3 }, { col: 5, row: 4 })).toBe(3);
  });

  it('sąsiedzi są w odległości 1', () => {
    for (const neighbor of hexNeighbors({ col: 4, row: 4 })) {
      expect(hexDistance({ col: 4, row: 4 }, neighbor)).toBe(1);
    }
  });
});

describe('hexNeighbors', () => {
  it('zwraca sześć różnych sąsiadów', () => {
    const neighbors = hexNeighbors({ col: 4, row: 4 });
    const keys = neighbors.map((neighbor) => `${neighbor.col},${neighbor.row}`);

    expect(neighbors).toHaveLength(6);
    expect(new Set(keys).size).toBe(6);
  });
});

describe('układ offset odd-r', () => {
  it('parzystość wiersza liczy się z bezwzględnego row', () => {
    const size = 22;

    const even = hexToPixel({ col: 3, row: 0 }, size);
    const evenBelow = hexToPixel({ col: 3, row: 2 }, size);
    const odd = hexToPixel({ col: 3, row: 1 }, size);
    const oddAbove = hexToPixel({ col: 3, row: -1 }, size);

    expect(evenBelow.x).toBe(even.x);
    expect(oddAbove.x).toBe(odd.x);
    expect(odd.x - even.x).toBeCloseTo((Math.sqrt(3) / 2) * size);
  });

  it('wiersze o różnej parzystości są przesunięte o pół heksa', () => {
    const size = 22;

    const row0 = hexToPixel({ col: 0, row: 0 }, size);
    const row1 = hexToPixel({ col: 0, row: 1 }, size);

    expect(row1.y - row0.y).toBeCloseTo(1.5 * size);
    expect(row1.x - row0.x).toBeCloseTo((Math.sqrt(3) / 2) * size);
  });
});

describe('konwersja piksel — hex', () => {
  it('odtwarza heks po pikselu', () => {
    const size = 22;

    for (const coord of [
      { col: 0, row: 0 },
      { col: 5, row: 3 },
      { col: 11, row: 7 },
    ]) {
      const pixel = hexToPixel(coord, size);
      expect(pixelToHex(pixel.x, pixel.y, size)).toEqual(coord);
    }
  });

  it('ląduje w najbliższym heksie dla środka kafla', () => {
    const size = 22;
    const coord = { col: 4, row: 2 };
    const pixel = hexToPixel(coord, size);

    expect(pixelToHex(pixel.x + 3, pixel.y - 2, size)).toEqual(coord);
  });

  it('odtwarza heksy o ujemnych współrzędnych', () => {
    const size = 22;

    for (const coord of [
      { col: -2, row: -1 },
      { col: 3, row: -4 },
      { col: -7, row: -6 },
    ]) {
      const pixel = hexToPixel(coord, size);
      expect(pixelToHex(pixel.x, pixel.y, size)).toEqual(coord);
    }
  });
});
