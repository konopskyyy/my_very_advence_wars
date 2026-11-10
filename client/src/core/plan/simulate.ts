import { canAttackThisTurn } from '../combat';
import { hexDistance, type HexCoord } from '../map/layout';
import { findUnitAt, getMoveCost } from '../map/movement';
import { IMPASSABLE } from '../map/terrain';
import type { GameState } from '../state';
import { shotMoveCost, UNIT_DEFS, type Unit } from '../units';
import type { PlanAction, TurnPlan } from './types';

const MOVE_EPSILON = 1e-9;

export interface ActionStep {
  readonly action: PlanAction;
  readonly index: number;
  readonly before: Unit;
  readonly after: Unit;
}

function replaceUnit(state: GameState, unit: Unit): GameState {
  return {
    ...state,
    units: state.units.map((candidate) => (candidate.id === unit.id ? unit : candidate)),
  };
}

function walkPath(state: GameState, unit: Unit, path: readonly HexCoord[]): Unit | undefined {
  if (path.length === 0) {
    return undefined;
  }

  let current = unit;
  const pathState = replaceUnit(state, unit);

  for (const coord of path) {
    if (current.hasActed || current.movesLeft <= 0) {
      return undefined;
    }

    if (hexDistance(current.pos, coord) !== 1) {
      return undefined;
    }

    const occupant = findUnitAt(pathState, coord);

    if (occupant && occupant.id !== unit.id) {
      return undefined;
    }

    const cost = getMoveCost(pathState, coord);

    if (cost >= IMPASSABLE || cost > current.movesLeft) {
      return undefined;
    }

    const movesLeft = current.movesLeft - cost;
    const exhausted = movesLeft <= MOVE_EPSILON;

    current = {
      ...current,
      pos: coord,
      movesLeft: exhausted ? 0 : movesLeft,
      hasActed: exhausted,
    };
  }

  return current;
}

export function applyAttackCost(unit: Unit): Unit {
  const stats = UNIT_DEFS[unit.kind];

  if (unit.kind !== 'artillery') {
    return { ...unit, hasActed: true };
  }

  const cost = shotMoveCost(stats) ?? 0;
  const movesLeft = unit.movesLeft - cost;
  const exhausted = movesLeft <= MOVE_EPSILON;

  return {
    ...unit,
    movesLeft: exhausted ? 0 : movesLeft,
    hasActed: exhausted,
  };
}

export function walkActions(
  state: GameState,
  unit: Unit,
  actions: readonly PlanAction[],
  visit?: (step: ActionStep) => void,
): Unit | undefined {
  let current = unit;

  for (const [index, action] of actions.entries()) {
    const before = current;

    if (action.kind === 'move') {
      const moved = walkPath(state, current, action.path);

      if (!moved) {
        return undefined;
      }

      current = moved;
    } else {
      const target = state.units.find((candidate) => candidate.id === action.targetId);

      if (!target || target.id === current.id || target.faction === current.faction) {
        return undefined;
      }

      if (!canAttackThisTurn(current)) {
        return undefined;
      }

      if (hexDistance(current.pos, target.pos) > UNIT_DEFS[current.kind].attackRange) {
        return undefined;
      }

      current = applyAttackCost(current);
    }

    visit?.({ action, index, before, after: current });
  }

  return current;
}

export function simulateUnit(
  state: GameState,
  unit: Unit,
  actions: readonly PlanAction[],
): Unit | undefined {
  return walkActions(state, unit, actions);
}

export function planningState(state: GameState, plan: TurnPlan): GameState {
  const planned = new Map<string, Unit>();

  for (const unitPlan of plan.units) {
    const unit = state.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const simulated = simulateUnit(state, unit, unitPlan.actions);

    if (simulated) {
      planned.set(unit.id, simulated);
    }
  }

  return {
    ...state,
    units: state.units.map((unit) => planned.get(unit.id) ?? unit),
  };
}
