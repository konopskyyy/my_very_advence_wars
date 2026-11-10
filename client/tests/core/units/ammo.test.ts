import { describe, expect, it } from 'vitest';
import { canAttackThisTurn } from '../../../src/core/combat';
import {
  ARTILLERY_AMMO,
  ARTILLERY_STATS,
  createUnit,
  TANK_AMMO,
  TANK_STATS,
  shotMoveCost,
  shotsLeft,
  UNIT_DEFS,
} from '../../../src/core/units';

describe('shotMoveCost', () => {
  it('dzieli zasięg ruchu przez liczbę pocisków', () => {
    expect(shotMoveCost(TANK_STATS)).toBe(TANK_STATS.moveRange / TANK_AMMO);
    expect(shotMoveCost(ARTILLERY_STATS)).toBe(ARTILLERY_STATS.moveRange / ARTILLERY_AMMO);
  });

  it('zwraca undefined dla jednostki bez pocisków', () => {
    expect(shotMoveCost(UNIT_DEFS.infantry)).toBeUndefined();
  });
});

describe('shotsLeft', () => {
  it('na starcie przyznaje pełną liczbę pocisków', () => {
    const tank = createUnit('tank', 'tank', 'blue', { col: 0, row: 0 });
    const artillery = createUnit('artillery', 'artillery', 'blue', { col: 0, row: 0 });

    expect(shotsLeft(tank)).toBe(TANK_AMMO);
    expect(shotsLeft(artillery)).toBe(ARTILLERY_AMMO);
  });

  it('przelicza pociski z pozostałego ruchu', () => {
    const tank = createUnit('tank', 'tank', 'blue', { col: 0, row: 0 });
    const artillery = createUnit('artillery', 'artillery', 'blue', { col: 0, row: 0 });

    expect(shotsLeft({ ...tank, movesLeft: 2 })).toBe(4);
    expect(shotsLeft({ ...tank, movesLeft: 1 })).toBe(2);
    expect(shotsLeft({ ...artillery, movesLeft: 1 })).toBe(3);
  });

  it('nie przyznaje pocisków jednostce po akcji', () => {
    const tank = createUnit('tank', 'tank', 'blue', { col: 0, row: 0 });

    expect(shotsLeft({ ...tank, hasActed: true })).toBe(0);
  });

  it('nie ogranicza jednostek, które nie zużywają pocisków', () => {
    const infantry = createUnit('infantry', 'infantry', 'blue', { col: 0, row: 0 });

    expect(shotsLeft(infantry)).toBe(Number.POSITIVE_INFINITY);
    expect(canAttackThisTurn({ ...infantry, movesLeft: 0 })).toBe(true);
  });
});
