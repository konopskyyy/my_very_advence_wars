import { describe, expect, it } from 'vitest';
import { hexKey, hexNeighbors, type Hex } from './core/hex';
import { canMoveTo } from './core/movement';
import { BOARD_COLUMNS, BOARD_ROWS, isBoardHex } from './hexLayout';
import { TANK_START, terrainAt } from './sampleMap';

const EDGE_HEXES: readonly Hex[] = [
  { q: 0, r: 0 },
  { q: 2, r: 0 },
  { q: 1, r: 1 },
  { q: 0, r: 12 },
  { q: 74, r: 12 },
  { q: 73, r: 11 },
];

describe('granice planszy', () => {
  it('czolg startuje na polu planszy', () => {
    expect(isBoardHex(TANK_START)).toBe(true);
    expect(terrainAt(TANK_START)).toBeDefined();
  });

  it('nie zna terenu heksów spoza planszy', () => {
    expect(terrainAt({ q: -2, r: 0 })).toBeUndefined();
    expect(terrainAt({ q: 1, r: -1 })).toBeUndefined();
    expect(terrainAt({ q: 0, r: 13 })).toBeUndefined();
    expect(terrainAt({ q: 76, r: 12 })).toBeUndefined();
    expect(terrainAt({ q: 100, r: 100 })).toBeUndefined();
  });

  it('nie pozwala czołgowi wyjeść poza planszę', () => {
    for (const from of EDGE_HEXES) {
      for (const neighbor of hexNeighbors(from)) {
        if (isBoardHex(neighbor)) continue;

        expect(canMoveTo(from, neighbor, terrainAt)).toEqual({
          ok: false,
          reason: 'out-of-bounds',
        });
      }
    }
  });

  it('każdy dozwolony ruch kończy się na polu planszy', () => {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let q = 0; q < BOARD_COLUMNS; q++) {
        const from: Hex = { q: 2 * q + (r & 1), r };

        for (const neighbor of hexNeighbors(from)) {
          const move = canMoveTo(from, neighbor, terrainAt);
          if (!move.ok) continue;

          expect(isBoardHex(neighbor)).toBe(true);
          expect(terrainAt(neighbor)).toBeDefined();
        }
      }
    }
  });

  it('losowy spacer czołgu nigdy nie wychodzi poza planszę', () => {
    let position: Hex = { ...TANK_START };
    let seed = 12345;

    const random = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let step = 0; step < 5000; step++) {
      const neighbors = hexNeighbors(position);
      const target = neighbors[Math.floor(random() * neighbors.length)];
      if (!target) continue;

      if (canMoveTo(position, target, terrainAt).ok) {
        position = target;
      }

      expect(isBoardHex(position)).toBe(true);
      expect(terrainAt(position)).toBeDefined();
    }
  });

  it('każde pole planszy ma teren', () => {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let q = 0; q < BOARD_COLUMNS; q++) {
        const hex: Hex = { q: 2 * q + (r & 1), r };
        expect(terrainAt(hex)).toBeDefined();
      }
    }
  });

  it('nie duplikuje pól planszy', () => {
    const keys = new Set<string>();

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let q = 0; q < BOARD_COLUMNS; q++) {
        keys.add(hexKey({ q: 2 * q + (r & 1), r }));
      }
    }

    expect(keys.size).toBe(BOARD_ROWS * BOARD_COLUMNS);
  });
});
