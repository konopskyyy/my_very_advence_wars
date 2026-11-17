import { describe, expect, it } from 'vitest';
import { canAttackThisTurn } from '../../../src/core/combat';
import {
  applyAttackCost,
  ARTILLERY_AMMO,
  ARTILLERY_STATS,
  BOMBER_AMMO,
  BOMBER_STATS,
  createUnit,
  FULL_MAP_RANGE,
  INFANTRY_STATS,
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
    expect(shotMoveCost(BOMBER_STATS)).toBe(BOMBER_STATS.moveRange / BOMBER_AMMO);
  });

  it('zwraca 1 punkt dla jednostki bez pocisków', () => {
    expect(shotMoveCost(UNIT_DEFS.infantry)).toBe(1);
    expect(shotMoveCost(UNIT_DEFS.scout)).toBe(1);
  });
});

describe('applyAttackCost', () => {
  it('odejmuje koszt strzału i zostawia resztę ruchu', () => {
    const tank = createUnit('tank', 'tank', 'blue', { col: 0, row: 0 });
    const after = applyAttackCost(tank);

    expect(after.movesLeft).toBe(TANK_STATS.moveRange - TANK_STATS.moveRange / TANK_AMMO);
    expect(after.hasActed).toBe(false);
  });

  it('ustawia hasActed dopiero przy zerowym ruchu', () => {
    const infantry = createUnit('infantry', 'infantry', 'blue', { col: 0, row: 0 });
    const after = applyAttackCost({ ...infantry, movesLeft: 1 });

    expect(after.movesLeft).toBe(0);
    expect(after.hasActed).toBe(true);
  });

  it('zużywa jedyny pocisk bombowca jednym atakiem', () => {
    const bomber = createUnit('bomber', 'bomber', 'blue', { col: 0, row: 0 });
    const after = applyAttackCost(bomber);

    expect(after.movesLeft).toBe(0);
    expect(after.hasActed).toBe(true);
    expect(canAttackThisTurn(after)).toBe(false);
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

  it('liczy strzały jednostek bez pocisków z ruchu', () => {
    const infantry = createUnit('infantry', 'infantry', 'blue', { col: 0, row: 0 });

    expect(shotsLeft(infantry)).toBe(INFANTRY_STATS.moveRange);
    expect(canAttackThisTurn({ ...infantry, movesLeft: 0 })).toBe(false);
  });

  it('przyznaje bombowcowi jeden pocisk na całą mapę', () => {
    const bomber = createUnit('bomber', 'bomber', 'blue', { col: 0, row: 0 });

    expect(BOMBER_STATS.attackRange).toBe(FULL_MAP_RANGE);
    expect(shotsLeft(bomber)).toBe(1);
  });
});
