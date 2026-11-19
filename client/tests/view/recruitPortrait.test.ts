import { describe, expect, it } from 'vitest';
import { loadoutPortraitKey } from '../../src/view/recruitPortrait';

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
});
