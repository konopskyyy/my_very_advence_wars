import type { HexCoord } from '../map';
import type { GameState } from '../state';
import { loadPassenger } from '../transport';
import { UNIT_DEFS, type Unit } from '../units';
import { boardingTarget, walkActions } from './simulate';
import type { TurnPlan } from './types';

export const MOVE_STEP_MS = 250;
export const FIRE_MS = 700;

export interface TimelineMoveClip {
  readonly kind: 'move';
  readonly unitId: string;
  readonly actionIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly from: HexCoord;
  readonly path: readonly HexCoord[];
}

export interface TimelineAttackClip {
  readonly kind: 'attack';
  readonly unitId: string;
  readonly actionIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly attackerPos: HexCoord;
  readonly targetId: string;
  readonly targetPos: HexCoord;
  readonly damage: number;
}

export type TimelineClip = TimelineMoveClip | TimelineAttackClip;

export interface TurnTimeline {
  readonly durationMs: number;
  readonly clips: readonly TimelineClip[];
}

export interface UnitFrame {
  readonly unitId: string;
  readonly from: HexCoord;
  readonly to: HexCoord;
  readonly progress: number;
}

export interface TimelineFrame {
  readonly timeMs: number;
  readonly units: readonly UnitFrame[];
  readonly attacks: readonly TimelineAttackClip[];
}

interface UnitBuild {
  readonly unitId: string;
  readonly total: number;
  readonly clips: readonly TimelineClip[];
}

function idleFrame(unit: Unit): UnitFrame {
  return { unitId: unit.id, from: unit.pos, to: unit.pos, progress: 0 };
}

export function buildTimeline(plan: TurnPlan, state: GameState): TurnTimeline {
  const builds: UnitBuild[] = [];
  let current = state;

  for (const unitPlan of plan.units) {
    const unit = current.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    let cursor = 0;
    const clips: TimelineClip[] = [];
    const simulated = walkActions(current, unit, unitPlan.actions, (step) => {
      const startMs = cursor;
      const action = step.action;

      if (action.kind === 'move' || action.kind === 'board') {
        cursor += action.path.length * MOVE_STEP_MS;
        clips.push({
          kind: 'move',
          unitId: unit.id,
          actionIndex: step.index,
          startMs,
          endMs: cursor,
          from: step.before.pos,
          path: action.path,
        });
        return;
      }

      const target = current.units.find((candidate) => candidate.id === action.targetId);
      cursor += FIRE_MS;
      clips.push({
        kind: 'attack',
        unitId: unit.id,
        actionIndex: step.index,
        startMs,
        endMs: cursor,
        attackerPos: step.before.pos,
        targetId: action.targetId,
        targetPos: target?.pos ?? step.before.pos,
        damage: UNIT_DEFS[unit.kind].attack,
      });
    });

    if (simulated) {
      current = {
        ...current,
        units: current.units.map((candidate) =>
          candidate.id === simulated.id ? simulated : candidate,
        ),
      };

      const boardTarget = boardingTarget(unitPlan.actions);

      if (boardTarget) {
        current = loadPassenger(current, unit.id, boardTarget);
      }
    }

    builds.push({ unitId: unit.id, total: cursor, clips });
  }

  const durationMs = builds.reduce((longest, build) => Math.max(longest, build.total), 0);
  const clips: TimelineClip[] = [];

  for (const build of builds) {
    const offset = durationMs - build.total;

    for (const clip of build.clips) {
      clips.push({ ...clip, startMs: clip.startMs + offset, endMs: clip.endMs + offset });
    }
  }

  return { durationMs, clips };
}

function clipsForUnit(timeline: TurnTimeline, unitId: string): readonly TimelineClip[] {
  return timeline.clips.filter((clip) => clip.unitId === unitId);
}

function frameAt(unit: Unit, clips: readonly TimelineClip[], timeMs: number): UnitFrame {
  if (clips.length === 0) {
    return idleFrame(unit);
  }

  const startMs = clips[0]!.startMs;

  if (timeMs <= startMs) {
    return idleFrame(unit);
  }

  let active = clips[0]!;

  for (const clip of clips) {
    if (clip.startMs <= timeMs) {
      active = clip;
    }
  }

  if (active.kind === 'attack') {
    return { unitId: unit.id, from: active.attackerPos, to: active.attackerPos, progress: 0 };
  }

  const local = Math.max(0, Math.min(timeMs, active.endMs) - active.startMs);
  const lastIndex = active.path.length - 1;
  const index = Math.min(lastIndex, Math.floor(local / MOVE_STEP_MS));
  const stepProgress = Math.min(1, (local - index * MOVE_STEP_MS) / MOVE_STEP_MS);
  const from = index === 0 ? active.from : active.path[index - 1]!;
  const to = active.path[index]!;

  return { unitId: unit.id, from, to, progress: stepProgress };
}

export function sampleTimeline(
  timeline: TurnTimeline,
  state: GameState,
  timeMs: number,
): TimelineFrame {
  const clamped = Math.max(0, Math.min(timeline.durationMs, timeMs));
  const attacks: TimelineAttackClip[] = [];

  for (const clip of timeline.clips) {
    if (clip.kind === 'attack' && clamped >= clip.startMs && clamped < clip.endMs) {
      attacks.push(clip);
    }
  }

  return {
    timeMs: clamped,
    units: state.units.map((unit) => frameAt(unit, clipsForUnit(timeline, unit.id), clamped)),
    attacks,
  };
}
