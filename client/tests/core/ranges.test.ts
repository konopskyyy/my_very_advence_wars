import { describe, expect, it } from 'vitest';
import { createMap, hexDistance, hexNeighbors } from '../../src/core/map';
import { attackTiles, hexesInRange, visionTiles } from '../../src/core/ranges';
import { createUnit, FULL_MAP_RANGE, UNIT_DEFS, type UnitKind } from '../../src/core/units';

function key(coord: { col: number; row: number }): string {
  return `${coord.col},${coord.row}`;
}

describe('hexesInRange', () => {
  it('zwraca sąsiadów w promieniu 1 bez heksa źródłowego', () => {
    const map = createMap(7, 7);
    const origin = { col: 3, row: 3 };
    const tiles = hexesInRange(map, origin, 1);

    expect(tiles).toHaveLength(6);
    expect(tiles.map(key)).not.toContain(key(origin));
    expect(new Set(tiles.map(key))).toEqual(new Set(hexNeighbors(origin).map(key)));
  });

  it('pomija heksy spoza mapy i dalsze niż promień', () => {
    const map = createMap(2, 2);
    const origin = { col: 0, row: 0 };
    const tiles = hexesInRange(map, origin, 10);

    expect(tiles).toHaveLength(3);
    expect(tiles.every((coord) => hexDistance(origin, coord) <= 10)).toBe(true);
  });

  it('promień 0 daje pustą listę', () => {
    expect(hexesInRange(createMap(3, 3), { col: 1, row: 1 }, 0)).toEqual([]);
  });
});

describe('zasięgi jednostek', () => {
  const map = createMap(11, 11);
  const origin = { col: 5, row: 5 };

  function unit(kind: UnitKind) {
    return createUnit('u1', kind, 'blue', origin);
  }

  it('wzrok wynika z visionRange', () => {
    for (const kind of ['infantry', 'tank', 'artillery', 'scout'] as const) {
      expect(visionTiles(map, unit(kind))).toEqual(
        hexesInRange(map, origin, UNIT_DEFS[kind].visionRange),
      );
    }
  });

  it('strzał wynika z attackRange', () => {
    for (const kind of ['infantry', 'tank', 'artillery', 'scout'] as const) {
      expect(attackTiles(map, unit(kind))).toEqual(
        hexesInRange(map, origin, UNIT_DEFS[kind].attackRange),
      );
    }
  });

  it('artyleria razi dalej niż piechota', () => {
    expect(UNIT_DEFS.artillery.attackRange).toBeGreaterThan(UNIT_DEFS.infantry.attackRange);
    expect(attackTiles(map, unit('artillery')).length).toBeGreaterThan(
      attackTiles(map, unit('infantry')).length,
    );
  });

  it('artyleria ma skończony, duży zasięg zamiast nieskończoności', () => {
    expect(Number.isFinite(UNIT_DEFS.artillery.visionRange)).toBe(true);
    expect(Number.isFinite(UNIT_DEFS.artillery.attackRange)).toBe(true);
    expect(UNIT_DEFS.artillery.visionRange).toBe(FULL_MAP_RANGE);
    expect(UNIT_DEFS.artillery.attackRange).toBe(FULL_MAP_RANGE);
  });

  it('artyleria obejmuje wszystkie kafle mapy poza własnym heksem', () => {
    expect(attackTiles(map, unit('artillery'))).toHaveLength(Object.keys(map.cells).length - 1);
  });

  it('artyleria widzi wszystkie kafle mapy poza własnym heksem', () => {
    expect(visionTiles(map, unit('artillery'))).toHaveLength(Object.keys(map.cells).length - 1);
  });

  it('zwiad widzi dalej niż czołg', () => {
    expect(UNIT_DEFS.scout.visionRange).toBeGreaterThan(UNIT_DEFS.tank.visionRange);
    expect(visionTiles(map, unit('scout')).length).toBeGreaterThan(
      visionTiles(map, unit('tank')).length,
    );
  });
});
