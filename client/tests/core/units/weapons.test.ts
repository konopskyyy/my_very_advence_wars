import { describe, expect, it } from 'vitest';
import { RIFLE, UNIT_DEFS } from '../../../src/core/units';

describe('dźwięki jednostek', () => {
  it('przypisuje piechocie karabin i dźwięk kroku', () => {
    expect(UNIT_DEFS.infantry.weapon).toBe(RIFLE);
    expect(UNIT_DEFS.infantry.moveSound).toBe('step');
    expect(UNIT_DEFS.infantry.deathSound).toBe('death');
  });

  it('nie przypisuje broni ani dźwięków ruchu i śmierci pojazdom', () => {
    expect(UNIT_DEFS.tank.weapon).toBeUndefined();
    expect(UNIT_DEFS.tank.moveSound).toBeUndefined();
    expect(UNIT_DEFS.tank.deathSound).toBeUndefined();
    expect(UNIT_DEFS.artillery.weapon).toBeUndefined();
    expect(UNIT_DEFS.artillery.moveSound).toBeUndefined();
    expect(UNIT_DEFS.artillery.deathSound).toBeUndefined();
    expect(UNIT_DEFS.scout.weapon).toBeUndefined();
    expect(UNIT_DEFS.scout.moveSound).toBeUndefined();
    expect(UNIT_DEFS.scout.deathSound).toBeUndefined();
  });

  it('karabin wskazuje dźwięk wystrzału', () => {
    expect(RIFLE.shotSound).toBe('rifle-shot');
  });
});
