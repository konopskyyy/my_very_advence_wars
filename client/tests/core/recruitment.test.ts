import { describe, expect, it } from 'vitest';
import {
  canAfford,
  createRecruitment,
  DEFAULT_FUNDS,
  purchaseUnit,
  recruitmentDenial,
  remainingPurchases,
  unitCost,
} from '../../src/core/recruitment';
import { PIERWSZE_KROKI } from '../../src/core/campaign/missions/pierwsze-kroki';
import { UNIT_KINDS } from '../../src/core/units';

describe('ceny jednostek', () => {
  it('ustala koszt każdego rodzaju', () => {
    expect(unitCost('infantry')).toBe(100);
    expect(unitCost('scout')).toBe(150);
    expect(unitCost('tank')).toBe(300);
    expect(unitCost('artillery')).toBe(250);
  });
});

describe('stan rekrutacji', () => {
  it('domyślnie daje pełny budżet i wszystkie rodzaje', () => {
    const state = createRecruitment();

    expect(state.funds).toBe(DEFAULT_FUNDS);
    expect(state.allowedKinds).toEqual(UNIT_KINDS);
    expect(state.limits).toEqual({});
    expect(state.grants).toEqual([]);
  });

  it('odmawia zakupu spoza dozwolonych rodzajów', () => {
    const state = createRecruitment({ funds: 1000, allowedKinds: ['infantry'] });

    expect(recruitmentDenial(state, 'tank')).toBe('forbidden');
    expect(recruitmentDenial(state, 'infantry')).toBeUndefined();
  });

  it('odmawia zakupu bez wystarczających środków', () => {
    const state = createRecruitment({ funds: 90 });

    expect(canAfford(state, 'infantry')).toBe(false);
    expect(recruitmentDenial(state, 'infantry')).toBe('funds');
  });

  it('odmawia zakupu po wyczerpaniu limitu', () => {
    const state = createRecruitment({ funds: 1000, limits: { infantry: 1 } });
    const bought = purchaseUnit(state, 'infantry');

    expect(bought).toBeDefined();
    expect(remainingPurchases(bought!, 'infantry')).toBe(0);
    expect(recruitmentDenial(bought!, 'infantry')).toBe('limit');
  });

  it('pobiera koszt i zwiększa licznik zakupów', () => {
    const state = createRecruitment({ funds: 1000 });
    const bought = purchaseUnit(state, 'tank');

    expect(bought?.funds).toBe(700);
    expect(bought?.purchased.tank).toBe(1);
    expect(state.funds).toBe(1000);
    expect(state.purchased.tank).toBeUndefined();
  });

  it('nie zmienia stanu, gdy zakup jest niedozwolony', () => {
    const state = createRecruitment({ funds: 100 });

    expect(purchaseUnit(state, 'tank')).toBeUndefined();
  });
});

describe('ekonomia pierwszej misji samouczka', () => {
  const rules = PIERWSZE_KROKI.mission?.recruitment;

  it('startuje z kwotą tylko na zwiadowcę', () => {
    expect(rules?.funds).toBe(150);
    expect(rules?.allowedKinds).toEqual(['scout']);

    const state = createRecruitment(rules);

    expect(recruitmentDenial(state, 'scout')).toBeUndefined();
    expect(recruitmentDenial(state, 'infantry')).toBe('forbidden');
  });

  it('po zakupie zwiadowcy odblokowuje trzech piechurów', () => {
    const afterScout = purchaseUnit(createRecruitment(rules), 'scout');

    expect(afterScout?.funds).toBe(300);
    expect(afterScout?.allowedKinds).toEqual(['infantry']);
    expect(remainingPurchases(afterScout!, 'infantry')).toBe(3);
  });

  it('pozwala kupić dokładnie trzech piechurów', () => {
    let state = purchaseUnit(createRecruitment(rules), 'scout');

    for (let index = 0; index < 3; index += 1) {
      state = purchaseUnit(state!, 'infantry');
    }

    expect(state?.funds).toBe(0);
    expect(state?.purchased.infantry).toBe(3);
    expect(recruitmentDenial(state!, 'infantry')).toBe('limit');
    expect(purchaseUnit(state!, 'infantry')).toBeUndefined();
  });
});
