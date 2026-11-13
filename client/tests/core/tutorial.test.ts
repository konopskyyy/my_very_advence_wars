import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../src/core/campaign/missions/pierwsze-kroki';
import type { TurnPlan } from '../../src/core/plan';
import { createRecruitment, purchaseUnit, type RecruitmentState } from '../../src/core/recruitment';
import {
  activeTutorialHint,
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

  it('liczy ruchy i ataki z planu tury', () => {
    const plan: TurnPlan = {
      faction: 'blue',
      turn: 1,
      units: [
        {
          unitId: 'blue-1',
          actions: [
            { kind: 'move', path: [] },
            { kind: 'attack', targetId: 'red-1' },
          ],
        },
      ],
    };
    const result = tutorialProgress(createRecruitment(), plan);

    expect(result.moves).toBe(1);
    expect(result.attacks).toBe(1);
  });
});
