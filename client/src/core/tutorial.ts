import type { TurnPlan } from './plan';
import {
  applyRecruitmentReward,
  type RecruitmentReward,
  type RecruitmentState,
} from './recruitment';
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
  readonly reward?: RecruitmentReward;
}

export interface TutorialRewardResult {
  readonly recruitment: RecruitmentState;
  readonly applied: readonly number[];
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
      if (action.kind === 'move' || action.kind === 'board') {
        moves += 1;
      } else if (action.kind === 'attack') {
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
  const step = script?.steps.find((candidate) => !tutorialGoalReached(candidate.until, progress));

  return step?.hint;
}

export function tutorialComplete(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
): boolean {
  if (!script || script.steps.length === 0) {
    return false;
  }

  return script.steps.every((step) => tutorialGoalReached(step.until, progress));
}

export function applyTutorialRewards(
  recruitment: RecruitmentState,
  script: TutorialScript | undefined,
  progress: TutorialProgress,
  applied: ReadonlySet<number>,
): TutorialRewardResult {
  let next = recruitment;
  const nextApplied = [...applied];

  script?.steps.forEach((step, index) => {
    if (!step.reward || applied.has(index) || !tutorialGoalReached(step.until, progress)) {
      return;
    }

    next = applyRecruitmentReward(next, step.reward);
    nextApplied.push(index);
  });

  return { recruitment: next, applied: nextApplied.sort((left, right) => left - right) };
}

export function tutorialGoalReached(goal: TutorialGoal, progress: TutorialProgress): boolean {
  const purchasesReached =
    goal.purchased === undefined ||
    (progress.purchased[goal.purchased] ?? 0) >= (goal.count ?? 1);

  return (
    purchasesReached &&
    (progress.moves ?? 0) >= (goal.moves ?? 0) &&
    (progress.attacks ?? 0) >= (goal.attacks ?? 0)
  );
}
