import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOADOUT,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,
  loadoutPrice,
  primaryWeapon,
  secondaryWeapon,
} from '../../src/core/loadout';

describe('uzbrojenie w oknie KUP', () => {
  it('udostępnia dokładnie dwie listy z wymaganymi opcjami', () => {
    expect(PRIMARY_WEAPONS.map((weapon) => weapon.label)).toEqual([
      'Karabin',
      'Bazooka',
      'Snajperka',
    ]);
    expect(SECONDARY_WEAPONS.map((weapon) => weapon.label)).toEqual(['Pistolet', 'Granaty']);
  });

  it('liczy dopłatę za wybrany zestaw', () => {
    expect(loadoutPrice(DEFAULT_LOADOUT)).toBe(0);
    expect(loadoutPrice({ primary: 'bazooka', secondary: 'pistol' })).toBe(100);
    expect(loadoutPrice({ primary: 'sniper', secondary: 'grenades' })).toBe(105);
  });

  it('znajduje opcje po identyfikatorze', () => {
    expect(primaryWeapon('sniper').label).toBe('Snajperka');
    expect(secondaryWeapon('grenades').price).toBe(30);
  });
});
