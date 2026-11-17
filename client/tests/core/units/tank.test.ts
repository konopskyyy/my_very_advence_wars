import { describe, expect, it } from 'vitest';
import { createTank, TANK_STATS } from '../../../src/core/units/tank';

describe('czołg', () => {
  it('ma trzy miejsca dla piechoty i zwiadowcy', () => {
    expect(TANK_STATS.capacity).toBe(3);
    expect(TANK_STATS.carries).toEqual(['infantry', 'scout']);
  });

  it('startuje bez ładunku', () => {
    const unit = createTank('t1', 'blue', { col: 2, row: 4 });

    expect(unit.kind).toBe('tank');
    expect(unit.cargo).toBeUndefined();
    expect(unit.movesLeft).toBe(TANK_STATS.moveRange);
  });
});
