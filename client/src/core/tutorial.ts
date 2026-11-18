import { hexDistance, type HexCoord } from './map';
import type { TurnPlan } from './plan';
import {
  applyRecruitmentReward,
  type RecruitmentReward,
  type RecruitmentState,
} from './recruitment';
import type { GameState } from './state';
import type { FactionId, UnitKind } from './units';

export interface TutorialHint {
  readonly title: string;
  readonly text: string;
}

export interface TutorialSpawn {
  readonly kind: UnitKind;
  readonly faction: FactionId;
  readonly col: number;
  readonly row: number;
}

export interface TutorialGoal {
  readonly purchased?: UnitKind;
  readonly count?: number;
  readonly moves?: number;
  readonly attacks?: number;
  readonly boarded?: number;
  readonly tankCol?: number;
  readonly survived?: number;
  readonly returned?: boolean;
  readonly bazookaHits?: number;
}

export interface TutorialStep {
  readonly hint: TutorialHint;
  readonly until: TutorialGoal;
  readonly reward?: RecruitmentReward;
  readonly spawn?: readonly TutorialSpawn[];
  readonly retireSpawn?: number;
}

export interface TutorialRewardResult {
  readonly recruitment: RecruitmentState;
  readonly applied: readonly number[];
}

export interface TutorialSpawnBatch {
  readonly index: number;
  readonly units: readonly TutorialSpawn[];
}

export interface TutorialScript {
  readonly steps: readonly TutorialStep[];
}

export interface TutorialStepState {
  readonly index: number;
  readonly hint: TutorialHint;
  readonly reached: boolean;
}

export interface TutorialProgress {
  readonly purchased: Partial<Record<UnitKind, number>>;
  readonly moves: number;
  readonly attacks: number;
  readonly boarded: number;
  readonly tankCol: number;
  readonly survived: number;
  readonly returned: boolean;
  readonly bazookaHits: number;
}

export interface TutorialObservation {
  readonly state?: GameState;
  readonly tankFaction?: FactionId;
  readonly base?: HexCoord;
  readonly survived?: number;
  readonly bazookaHits?: number;
}

export function tutorialProgress(
  recruitment: RecruitmentState,
  plan: TurnPlan,
  observation: TutorialObservation = {},
): TutorialProgress {
  let moves = 0;
  let attacks = 0;
  let boarded = 0;

  for (const unit of plan.units) {
    for (const action of unit.actions) {
      if (action.kind === 'move') {
        moves += 1;
      } else if (action.kind === 'board') {
        moves += 1;
        boarded += 1;
      } else if (action.kind === 'attack') {
        attacks += 1;
      }
    }
  }

  return {
    purchased: recruitment.purchased,
    moves,
    attacks,
    boarded,
    tankCol: observation.state
      ? maxTankColumn(observation.state, observation.tankFaction ?? plan.faction)
      : 0,
    survived: observation.survived ?? 0,
    returned: observation.state && observation.base
      ? tankAtBase(
          observation.state,
          observation.tankFaction ?? plan.faction,
          observation.base,
        )
      : false,
    bazookaHits: observation.bazookaHits ?? 0,
  };
}

export function activeTutorialHint(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
): TutorialHint | undefined {
  const step = script?.steps.find((candidate) => !tutorialGoalReached(candidate.until, progress));

  return step?.hint;
}

export function tutorialStepStates(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
): TutorialStepState[] {
  return (script?.steps ?? []).map((step, index) => ({
    index,
    hint: step.hint,
    reached: tutorialGoalReached(step.until, progress),
  }));
}

export function tutorialObjectiveStates(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
): TutorialStepState[] {
  const states = tutorialStepStates(script, progress);
  const currentIndex = states.findIndex((state) => !state.reached);

  return currentIndex === -1 ? states : states.slice(0, currentIndex + 1);
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

export function pendingTutorialSpawns(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
  applied: ReadonlySet<number>,
): TutorialSpawnBatch[] {
  const batches: TutorialSpawnBatch[] = [];

  script?.steps.forEach((step, index) => {
    const previousReached = script.steps
      .slice(0, index)
      .every((previous) => tutorialGoalReached(previous.until, progress));

    if (
      !step.spawn ||
      step.spawn.length === 0 ||
      applied.has(index) ||
      !previousReached ||
      !tutorialGoalReached(step.until, progress)
    ) {
      return;
    }

    batches.push({ index, units: step.spawn });
  });

  return batches;
}

export function pendingTutorialRetirements(
  script: TutorialScript | undefined,
  progress: TutorialProgress,
  applied: ReadonlySet<number>,
): number[] {
  const indices: number[] = [];

  script?.steps.forEach((step, index) => {
    if (
      step.retireSpawn === undefined ||
      applied.has(index) ||
      !tutorialGoalReached(step.until, progress)
    ) {
      return;
    }

    indices.push(index);
  });

  return indices;
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
    (progress.attacks ?? 0) >= (goal.attacks ?? 0) &&
    (progress.boarded ?? 0) >= (goal.boarded ?? 0) &&
    (progress.tankCol ?? 0) >= (goal.tankCol ?? 0) &&
    (progress.survived ?? 0) >= (goal.survived ?? 0) &&
    (goal.returned === undefined || progress.returned === goal.returned) &&
    (progress.bazookaHits ?? 0) >= (goal.bazookaHits ?? 0)
  );
}

function tankAtBase(state: GameState, faction: FactionId, base: HexCoord): boolean {
  return state.units.some(
    (unit) =>
      unit.kind === 'tank' && unit.faction === faction && hexDistance(unit.pos, base) <= 1,
  );
}

function maxTankColumn(state: GameState, faction: FactionId): number {
  return state.units.reduce(
    (max, unit) =>
      unit.kind === 'tank' && unit.faction === faction
        ? Math.max(max, unit.pos.col)
        : max,
    0,
  );
}