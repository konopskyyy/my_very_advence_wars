import type { TurnPlan } from './plan';
import type { RecruitmentState } from './recruitment';
import type { UnitKind } from './units';

export interface TutorialHint {
  readonly title: string;
  readonly text: string;
}

export interface TutorialGoal {
  readonly purchased?: UnitKind;
  readonly count?: number;
  readonly moves?: number;
  readonly attacks?: number;
}

export interface TutorialStep {
  readonly hint: TutorialHint;
  readonly until: TutorialGoal;
}

export interface TutorialScript {
  readonly steps: readonly TutorialStep[];
}

export interface TutorialProgress {
  readonly purchased: Partial<Record<UnitKind, number>>;
  readonly moves: number;
  readonly attacks: number;
}

export function tutorialProgress(
  recruitment: RecruitmentState,
  plan: TurnPlan,
): TutorialProgress {
  let moves = 0;
  let attacks = 0;

  for (const unit of plan.units) {
    for (const action of unit.actions) {
      if (action.kind === 'move') {
        moves += 1;
      } else {
        attacks += 1;
      }
    }
  }

  return { purchased: recruitment.purchased, moves, attacks };
}

export function activeTutorialHint(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
): TutorialHint | undefined {
  const step = script?.steps.find((candidate) => !goalReached(candidate.until, progress));

  return step?.hint;
}

function goalReached(goal: TutorialGoal, progress: TutorialProgress): boolean {
  const purchasesReached =
    goal.purchased === undefined ||
    (progress.purchased[goal.purchased] ?? 0) >= (goal.count ?? 1);

  return (
    purchasesReached &&
    (progress.moves ?? 0) >= (goal.moves ?? 0) &&
    (progress.attacks ?? 0) >= (goal.attacks ?? 0)
  );
}
