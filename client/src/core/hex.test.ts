import { describe, expect, it } from 'vitest';
import {
  fromAxial,
  hexDistance,
  hexNeighbors,
  hexToPixel,
  pixelToHex,
  toAxial,
} from './hex';

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
