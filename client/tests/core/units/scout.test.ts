import { describe, expect, it } from 'vitest';
import { createScout, SCOUT_STATS } from '../../../src/core/units/scout';

describe('zwiadowca', () => {
  it('jest jednostką pieszą bez ładowni', () => {
    expect(SCOUT_STATS.capacity).toBeUndefined();
    expect(SCOUT_STATS.carries).toBeUndefined();
    expect(SCOUT_STATS.moveRange).toBe(6);
    expect(SCOUT_STATS.cost).toBe(150);
  });

  it('startuje z pełnym ruchem i HP', () => {
    const unit = createScout('u1', 'blue', { col: 2, row: 6 });

    expect(unit.kind).toBe('scout');
    expect(unit.hp).toBe(SCOUT_STATS.maxHp);
    expect(unit.movesLeft).toBe(SCOUT_STATS.moveRange);
    expect(unit.cargo).toBeUndefined();
  });
});
