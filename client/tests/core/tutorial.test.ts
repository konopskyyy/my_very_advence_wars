import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../src/core/campaign/missions/pierwsze-kroki';
import type { TurnPlan } from '../../src/core/plan';
import { createRecruitment, purchaseUnit, type RecruitmentState } from '../../src/core/recruitment';
import {
  activeTutorialHint,
  applyTutorialRewards,
  tutorialComplete,
  tutorialProgress,
  type TutorialProgress,
  type TutorialScript,
} from '../../src/core/tutorial';

function progress(
  recruitment: RecruitmentState,
  moves = 0,
  attacks = 0,
): TutorialProgress {
  return { purchased: recruitment.purchased, moves, attacks };
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
    expect(tutorialComplete(script, { purchased: {}, moves: 1, attacks: 1 })).toBe(false);
    expect(
      tutorialComplete(script, {
        purchased: { scout: 1, infantry: 3 },
        moves: 1,
        attacks: 1,
      }),
    ).toBe(true);
    expect(tutorialComplete(undefined, { purchased: {}, moves: 1, attacks: 1 })).toBe(false);
  });
});
