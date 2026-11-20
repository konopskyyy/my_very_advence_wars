import { describe, expect, it } from 'vitest';
import {
  detailPortraitKey,
  loadoutPortraitKey,
  recruitPortraitKey,
} from '../../src/view/recruitPortrait';

describe('portret w oknie KUP', () => {
  it('używa innej dostępnej grafiki dla każdego zestawu broni', () => {
    const keys = [
      loadoutPortraitKey({ primary: 'rifle', secondary: 'pistol' }),
      loadoutPortraitKey({ primary: 'rifle', secondary: 'grenades' }),
      loadoutPortraitKey({ primary: 'bazooka', secondary: 'pistol' }),
      loadoutPortraitKey({ primary: 'bazooka', secondary: 'grenades' }),
      loadoutPortraitKey({ primary: 'sniper', secondary: 'pistol' }),
      loadoutPortraitKey({ primary: 'sniper', secondary: 'grenades' }),
    ];

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('zmienia grafikę przy zmianie broni podstawowej i dodatkowej', () => {
    const base = { primary: 'rifle', secondary: 'pistol' } as const;

    expect(loadoutPortraitKey({ ...base, secondary: 'grenades' })).not.toBe(
      loadoutPortraitKey(base),
    );
    expect(loadoutPortraitKey({ ...base, primary: 'sniper' })).not.toBe(
      loadoutPortraitKey(base),
    );
  });

  it('pokazuje portret wybranej jednostki przy domyślnym zestawie broni', () => {
    const defaultLoadout = { primary: 'rifle', secondary: 'pistol' } as const;

    expect(detailPortraitKey('tank', defaultLoadout)).toBe(recruitPortraitKey('tank'));
    expect(detailPortraitKey('scout', defaultLoadout)).toBe(recruitPortraitKey('scout'));
    expect(detailPortraitKey('helicopter', defaultLoadout)).toBe(
      recruitPortraitKey('helicopter'),
    );
  });

  it('podmienia portret jednostki po wyborze innej broni', () => {
    const loadout = { primary: 'bazooka', secondary: 'pistol' } as const;

    expect(detailPortraitKey('infantry', loadout)).toBe(loadoutPortraitKey(loadout));
  });

  it('zwiadowca zawsze pokazuje własny portret', () => {
    expect(detailPortraitKey('scout', { primary: 'sniper', secondary: 'grenades' })).toBe(
      recruitPortraitKey('scout'),
    );
  });
});
