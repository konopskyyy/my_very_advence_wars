import { describe, expect, it } from 'vitest';
import { canMoveTo } from './movement';
import { hexKey, hexNeighbors, isHexCoordinateValid, type Hex } from './hex';
import { Terrain } from './terrain';

// Miniaturowa plansza 2 kolumny x 2 wiersze — rdzeń logiki nie zna rozmiarów
// mapy, dostaje tylko odpowiedź z lookupu terenu.
const smallBoardTerrainAt = (hex: Hex): Terrain | undefined => {
  if (!isHexCoordinateValid(hex)) return undefined;
  if (hex.q < 0 || hex.q > 3 || hex.r < 0 || hex.r > 1) return undefined;
  return Terrain.Plains;
};

describe('movement board bounds', () => {
  it('blokuje ruch na heks o złej parzystości', () => {
    const from: Hex = { q: 0, r: 0 };
    const offBoard: Hex = { q: 0, r: 1 };

    expect(isHexCoordinateValid(offBoard)).toBe(false);
    expect(canMoveTo(from, offBoard, smallBoardTerrainAt)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
  });

  it('pozwala wejść na sąsiedni heks planszy', () => {
    const from: Hex = { q: 0, r: 0 };
    const to: Hex = { q: 2, r: 0 };

    expect(isHexCoordinateValid(to)).toBe(true);
    expect(canMoveTo(from, to, smallBoardTerrainAt)).toEqual({ ok: true });
  });

  it('blokuje ruch na heks, którego nie ma na mapie', () => {
    const from: Hex = { q: 0, r: 0 };
    const to: Hex = { q: 2, r: 0 };

    expect(canMoveTo(from, to, () => undefined)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
  });

  it('nie pozwala wyjść poza planszę żadną krawędzią', () => {
    const edges: readonly Hex[] = [
      { q: 0, r: 0 },
      { q: 3, r: 1 },
      { q: 2, r: 0 },
      { q: 1, r: 1 },
    ];

    for (const from of edges) {
      for (const neighbor of hexNeighbors(from)) {
        if (smallBoardTerrainAt(neighbor) !== undefined) continue;

        expect(canMoveTo(from, neighbor, smallBoardTerrainAt)).toEqual({
          ok: false,
          reason: 'out-of-bounds',
        });
      }
    }
  });

  it('odróżnia heks spoza planszy od nieprzejezdnego terenu', () => {
    const from: Hex = { q: 0, r: 0 };
    const to: Hex = { q: 2, r: 0 };

    expect(canMoveTo(from, to, () => Terrain.Water)).toEqual({
      ok: false,
      reason: 'impassable',
    });
    expect(canMoveTo(from, to, (hex) => (hexKey(hex) === '2,0' ? undefined : Terrain.Plains))).toEqual(
      { ok: false, reason: 'out-of-bounds' },
    );
  });
});
