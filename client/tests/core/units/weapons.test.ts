import { describe, expect, it } from 'vitest';
import { BAZOOKA, RIFLE, UNIT_DEFS } from '../../../src/core/units';

describe('dźwięki jednostek', () => {
  it('przypisuje piechocie karabin i dźwięk kroku', () => {
    expect(UNIT_DEFS.infantry.weapon).toBe(RIFLE);
    expect(UNIT_DEFS.infantry.moveSound).toBe('step');
    expect(UNIT_DEFS.infantry.deathSound).toBe('death');
  });

  it('nie przypisuje broni ani dźwięku śmierci pojazdom i zwiadowcy', () => {
    expect(UNIT_DEFS.tank.weapon).toBeUndefined();
    expect(UNIT_DEFS.tank.moveSound).toBe('step');
    expect(UNIT_DEFS.tank.deathSound).toBeUndefined();
    expect(UNIT_DEFS.artillery.weapon).toBeUndefined();
    expect(UNIT_DEFS.artillery.moveSound).toBeUndefined();
    expect(UNIT_DEFS.artillery.deathSound).toBeUndefined();
    expect(UNIT_DEFS.scout.weapon).toBeUndefined();
    expect(UNIT_DEFS.scout.moveSound).toBe('step');
    expect(UNIT_DEFS.scout.deathSound).toBeUndefined();
  });

  it('nazywa jednostkę żołnierzem z bazooką i daje jej dźwięk kroku', () => {
    expect(UNIT_DEFS.bazooka.label).toBe('Żołnierz z bazooką');
    expect(UNIT_DEFS.bazooka.weapon).toBe(BAZOOKA);
    expect(UNIT_DEFS.bazooka.moveSound).toBe('step');
    expect(UNIT_DEFS.bazooka.deathSound).toBe('death');
  });

  it('karabin wskazuje dźwięk wystrzału', () => {
    expect(RIFLE.shotSound).toBe('rifle-shot');
  });
});
