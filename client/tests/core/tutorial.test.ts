import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../src/core/campaign/missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from '../../src/core/campaign/missions/ruch-jednostek';
import { WALKA } from '../../src/core/campaign/missions/walka';
import { generateMap } from '../../src/core/map';
import type { TurnPlan } from '../../src/core/plan';
import { createRecruitment, purchaseUnit, type RecruitmentState } from '../../src/core/recruitment';
import { createInitialState, deployUnits } from '../../src/core/state';
import {
  activeTutorialHint,
  applyTutorialRewards,
  pendingTutorialRetirements,
  pendingTutorialSpawns,
  tutorialComplete,
  tutorialObjectiveStates,
  tutorialProgress,
  type TutorialProgress,
  type TutorialScript,
} from '../../src/core/tutorial';

function progress(
  recruitment: RecruitmentState,
  moves = 0,
  attacks = 0,
  extra: Partial<
    Pick<TutorialProgress, 'boarded' | 'tankCol' | 'survived' | 'returned' | 'bazookaHits'>
  > = {},
): TutorialProgress {
  return {
    purchased: recruitment.purchased,
    moves,
    attacks,
    boarded: 0,
    tankCol: 0,
    survived: 0,
    returned: false,
    bazookaHits: 0,
    ...extra,
  };
}

describe('podpowiedzi samouczka', () => {
  const script: TutorialScript = {
    steps: [
      { hint: { title: 'PIERWSZY', text: 'Kup zwiadowcę' }, until: { purchased: 'scout' } },
      {
        hint: { title: 'DRUGI', text: 'Kup trzech piechurów' },
        until: { purchased: 'infantry', count: 3 },
      },
      { hint: { title: 'PLANER', text: 'Zaplanuj ruch' }, until: { moves: 1 } },
      { hint: { title: 'ATAK', text: 'Zaplanuj atak' }, until: { attacks: 1 } },
    ],
  };

  it('bez skryptu nie pokazuje podpowiedzi', () => {
    expect(activeTutorialHint(undefined, progress(createRecruitment()))).toBeUndefined();
  });

  it('pokazuje pierwszy krok przed zakupem zwiadowcy', () => {
    expect(activeTutorialHint(script, progress(createRecruitment()))?.title).toBe('PIERWSZY');
  });

  it('po zakupie zwiadowcy pokazuje drugi krok', () => {
    const afterScout = purchaseUnit(createRecruitment(PIERWSZE_KROKI.mission?.recruitment), 'scout');

    expect(activeTutorialHint(script, progress(afterScout!))?.title).toBe('DRUGI');
  });

  it('po trzech piechurach pokazuje planer, potem atak', () => {
    let recruitment = purchaseUnit(
      createRecruitment(PIERWSZE_KROKI.mission?.recruitment),
      'scout',
    );

    recruitment = purchaseUnit(recruitment!, 'infantry');
    recruitment = purchaseUnit(recruitment!, 'infantry');
    recruitment = purchaseUnit(recruitment!, 'infantry');

    expect(activeTutorialHint(script, progress(recruitment!))?.title).toBe('PLANER');
    expect(activeTutorialHint(script, progress(recruitment!, 1))?.title).toBe('ATAK');
    expect(activeTutorialHint(script, progress(recruitment!, 1, 1))).toBeUndefined();
  });

  it('skrypt pierwszej misji kończy się po ruchu i ataku', () => {
    const rules = PIERWSZE_KROKI.mission?.recruitment;
    const tutorial = PIERWSZE_KROKI.mission?.tutorial;
    let recruitment = createRecruitment(rules);

    expect(activeTutorialHint(tutorial, progress(recruitment))?.title).toBe('REKRUTACJA');

    recruitment = purchaseUnit(recruitment, 'scout')!;
    expect(activeTutorialHint(tutorial, progress(recruitment))?.title).toBe('NAGRODA');

    for (let index = 0; index < 3; index += 1) {
      recruitment = purchaseUnit(recruitment, 'infantry')!;

      if (index < 2) {
        expect(activeTutorialHint(tutorial, progress(recruitment))?.title).toBe('NAGRODA');
      }
    }

    expect(activeTutorialHint(tutorial, progress(recruitment))?.title).toBe('PLANER');
    expect(activeTutorialHint(tutorial, progress(recruitment, 1))?.title).toBe('ATAK');
    expect(activeTutorialHint(tutorial, progress(recruitment, 1, 1))).toBeUndefined();
  });

  it('cele pokazują ukończone kroki i bieżący, bez przyszłych', () => {
    const before = tutorialObjectiveStates(script, progress(createRecruitment()));

    expect(before.map((state) => [state.hint.title, state.reached])).toEqual([['PIERWSZY', false]]);

    const afterScout = purchaseUnit(
      createRecruitment(PIERWSZE_KROKI.mission?.recruitment),
      'scout',
    );
    const second = tutorialObjectiveStates(script, progress(afterScout!));

    expect(second.map((state) => [state.hint.title, state.reached])).toEqual([
      ['PIERWSZY', true],
      ['DRUGI', false],
    ]);

    const all = tutorialObjectiveStates(script, {
      purchased: { scout: 1, infantry: 3 },
      moves: 1,
      attacks: 1,
      boarded: 0,
      tankCol: 0,
      survived: 0,
      returned: false,
      bazookaHits: 0,
    });

    expect(all.map((state) => state.reached)).toEqual([true, true, true, true]);
  });

  it('liczy ruchy, wsiadanie i ataki z planu tury', () => {
    const plan: TurnPlan = {
      faction: 'blue',
      turn: 1,
      units: [
        {
          unitId: 'blue-1',
          actions: [
            { kind: 'move', path: [] },
            { kind: 'board', targetId: 'blue-2', path: [] },
            { kind: 'attack', targetId: 'red-1' },
          ],
        },
      ],
    };
    const result = tutorialProgress(createRecruitment(), plan);

    expect(result.moves).toBe(2);
    expect(result.attacks).toBe(1);
    expect(result.boarded).toBe(1);
  });

  it('przyznaje nagrodę raz po spełnieniu warunku kroku', () => {
    const rewarded: TutorialScript = {
      steps: [
        { hint: { title: 'RUCH', text: 'Rusz się' }, until: { moves: 1 } },
        {
          hint: { title: 'CZOŁG', text: 'Kup czołg' },
          until: { moves: 2 },
          reward: { funds: 300, allowedKinds: ['tank'] },
        },
      ],
    };
    const before = createRecruitment();

    const early = applyTutorialRewards(before, rewarded, progress(before, 1), new Set());
    expect(early.recruitment.funds).toBe(before.funds);
    expect(early.applied).toEqual([]);

    const granted = applyTutorialRewards(before, rewarded, progress(before, 2), new Set());
    expect(granted.recruitment.funds).toBe(before.funds + 300);
    expect(granted.recruitment.allowedKinds).toContain('tank');
    expect(granted.applied).toEqual([1]);

    const again = applyTutorialRewards(
      granted.recruitment,
      rewarded,
      progress(granted.recruitment, 2),
      new Set(granted.applied),
    );
    expect(again.recruitment.funds).toBe(before.funds + 300);
  });

  it('kończy skrypt po spełnieniu wszystkich kroków', () => {
    expect(tutorialComplete(script, progress(createRecruitment()))).toBe(false);
    expect(
      tutorialComplete(script, {
        purchased: {},
        moves: 1,
        attacks: 1,
        boarded: 0,
        tankCol: 0,
        survived: 0,
        returned: false,
        bazookaHits: 0,
      }),
    ).toBe(false);
    expect(
      tutorialComplete(script, {
        purchased: { scout: 1, infantry: 3 },
        moves: 1,
        attacks: 1,
        boarded: 0,
        tankCol: 0,
        survived: 0,
        returned: false,
        bazookaHits: 0,
      }),
    ).toBe(true);
    expect(
      tutorialComplete(undefined, {
        purchased: {},
        moves: 1,
        attacks: 1,
        boarded: 0,
        tankCol: 0,
        survived: 0,
        returned: false,
        bazookaHits: 0,
      }),
    ).toBe(false);
  });

  it('dodaje jednostki kroku raz, dopiero po spełnieniu celu', () => {
    const spawning: TutorialScript = {
      steps: [
        {
          hint: { title: 'SPAWN', text: 'Wrogowie' },
          until: { moves: 1 },
          spawn: [{ kind: 'infantry', faction: 'red', col: 13, row: 5 }],
        },
      ],
    };
    const base = createRecruitment();

    expect(pendingTutorialSpawns(spawning, progress(base), new Set())).toEqual([]);

    const ready = pendingTutorialSpawns(spawning, progress(base, 1), new Set());

    expect(ready).toHaveLength(1);
    expect(ready[0]?.index).toBe(0);
    expect(ready[0]?.units[0]).toMatchObject({
      kind: 'infantry',
      faction: 'red',
      col: 13,
      row: 5,
    });
    expect(pendingTutorialSpawns(spawning, progress(base, 1), new Set([0]))).toEqual([]);
  });

  it('druga misja wymaga transportu, jazdy i odporności po zakupie czołgu', () => {
    const tutorial = RUCH_JEDNOSTEK.mission?.tutorial;

    expect(tutorial).toBeDefined();
    if (!tutorial) {
      return;
    }

    const base = createRecruitment();
    const withTank = { ...base, purchased: { tank: 1 } };
    const afterTank = progress(withTank, 4);

    expect(activeTutorialHint(tutorial, afterTank)?.title).toBe('TRANSPORT');
    expect(tutorialComplete(tutorial, afterTank)).toBe(false);

    const boarded = progress(withTank, 4, 0, { boarded: 1 });

    expect(activeTutorialHint(tutorial, boarded)?.title).toBe('JAZDA W PRAWO');

    const arrived = progress(withTank, 4, 0, { boarded: 1, tankCol: 12 });
    const arrivedWithoutBoard = progress(withTank, 4, 0, { tankCol: 12 });
    const spawns = pendingTutorialSpawns(tutorial, arrived, new Set());

    expect(activeTutorialHint(tutorial, arrived)?.title).toBe('ODPORNOŚĆ');
    expect(pendingTutorialSpawns(tutorial, arrivedWithoutBoard, new Set())).toEqual([]);
    expect(spawns).toHaveLength(1);
    expect(spawns[0]?.units.map((unit) => `${unit.faction}:${unit.kind}:${unit.col},${unit.row}`)).toEqual([
      'red:infantry:13,5',
      'red:infantry:14,6',
    ]);
    expect(tutorialComplete(tutorial, arrived)).toBe(false);

    const survived = progress(withTank, 4, 0, { boarded: 1, tankCol: 12, survived: 1 });

    expect(activeTutorialHint(tutorial, survived)?.title).toBe('POWRÓT DO BAZY');
    expect(pendingTutorialRetirements(tutorial, survived, new Set())).toEqual([7]);
    expect(pendingTutorialRetirements(tutorial, survived, new Set([7]))).toEqual([]);
    expect(tutorialComplete(tutorial, survived)).toBe(false);

    const backHome = { ...survived, returned: true };
    const bazooka = pendingTutorialSpawns(tutorial, backHome, new Set([6]));

    expect(activeTutorialHint(tutorial, backHome)?.title).toBe('BAZOOKA');
    expect(bazooka).toHaveLength(1);
    expect(bazooka[0]?.index).toBe(8);
    expect(bazooka[0]?.units).toEqual([
      { kind: 'bazooka', faction: 'red', col: 3, row: 5 },
    ]);
    expect(tutorialComplete(tutorial, backHome)).toBe(false);
    expect(
      tutorialComplete(tutorial, { ...backHome, bazookaHits: 1 }),
    ).toBe(true);
  });

  it('liczy powrót czołgu do bazy i trafienia bazooką', () => {
    const map = generateMap({ cols: 16, rows: 10, fill: 'plain' });
    const plan: TurnPlan = { faction: 'blue', turn: 1, units: [] };
    const base = { col: 2, row: 5 };
    const atBase = deployUnits(createInitialState(map), 'blue', [
      { kind: 'tank', col: 3, row: 5 },
    ]);
    const away = deployUnits(createInitialState(map), 'blue', [
      { kind: 'tank', col: 8, row: 5 },
    ]);

    expect(
      tutorialProgress(createRecruitment(), plan, {
        state: atBase,
        tankFaction: 'blue',
        base,
        bazookaHits: 2,
      }),
    ).toMatchObject({ returned: true, bazookaHits: 2 });
    expect(
      tutorialProgress(createRecruitment(), plan, {
        state: away,
        tankFaction: 'blue',
        base,
      }).returned,
    ).toBe(false);
  });

  it('trzecia misja wymaga zakupu bombera i dziewięciu ataków w jednym kroku', () => {
    const tutorial = WALKA.mission?.tutorial;

    expect(tutorial).toBeDefined();
    if (!tutorial) {
      return;
    }

    const base = createRecruitment({ funds: 0, allowedKinds: [] });
    const bomberBought: RecruitmentState = {
      ...createRecruitment({ funds: 250, allowedKinds: ['bomber'] }),
      purchased: { bomber: 1 },
    };

    expect(activeTutorialHint(tutorial, progress(base))?.title).toBe('PIERWSZY STRZAŁ');

    const first = progress(base, 0, 1);
    expect(activeTutorialHint(tutorial, first)?.title).toBe('DOCISNIJ CEL');
    expect(pendingTutorialSpawns(tutorial, first, new Set())).toEqual([]);

    const second = progress(base, 0, 2);
    const secondSpawns = pendingTutorialSpawns(tutorial, second, new Set());
    expect(activeTutorialHint(tutorial, second)?.title).toBe('JEDEN WOLUMEN');
    expect(secondSpawns).toHaveLength(1);
    expect(secondSpawns[0]?.units).toEqual([
      { kind: 'infantry', faction: 'red', col: 9, row: 4 },
      { kind: 'infantry', faction: 'red', col: 9, row: 6 },
    ]);

    const third = progress({ ...base, funds: 250, allowedKinds: ['bomber'] }, 0, 4);
    expect(activeTutorialHint(tutorial, third)?.title).toBe('NALOT');
    expect(pendingTutorialSpawns(tutorial, third, new Set([1]))).toEqual([
      { index: 2, units: [{ kind: 'tank', faction: 'red', col: 12, row: 5 }] },
    ]);
    expect(applyTutorialRewards(base, tutorial, third, new Set()).recruitment).toMatchObject({
      funds: 250,
      allowedKinds: ['bomber'],
    });
    expect(tutorialComplete(tutorial, third)).toBe(false);

    expect(tutorialComplete(tutorial, progress(bomberBought, 0, 8))).toBe(false);
    expect(tutorialComplete(tutorial, progress(base, 0, 9))).toBe(false);
    expect(tutorialComplete(tutorial, progress(bomberBought, 0, 9))).toBe(true);
  });
});
