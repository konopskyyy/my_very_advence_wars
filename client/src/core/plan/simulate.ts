import { canAttackThisTurn } from '../combat';
import { hexDistance, type HexCoord } from '../map/layout';
import { findUnitAt, getMoveCost } from '../map/movement';
import { IMPASSABLE } from '../map/terrain';
import type { GameState } from '../state';
import { canCarry, loadPassenger } from '../transport';
import { applyAttackCost, UNIT_DEFS, type Unit } from '../units';
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

function walkPath(
  state: GameState,
  unit: Unit,
  path: readonly HexCoord[],
  allowOccupantId?: string,
): Unit | undefined {
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

    if (occupant && occupant.id !== unit.id && occupant.id !== allowOccupantId) {
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

export { applyAttackCost };

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
    } else if (action.kind === 'board') {
      const vehicle = state.units.find((candidate) => candidate.id === action.targetId);

      if (!vehicle || !canCarry(vehicle, current)) {
        return undefined;
      }

      const moved = walkPath(state, current, action.path, vehicle.id);

      if (
        !moved ||
        moved.pos.col !== vehicle.pos.col ||
        moved.pos.row !== vehicle.pos.row
      ) {
        return undefined;
      }

      current = { ...moved, movesLeft: 0, hasActed: true };
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
  let current = state;

  for (const unitPlan of plan.units) {
    const unit = current.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const simulated = simulateUnit(current, unit, unitPlan.actions);

    if (simulated) {
      current = replaceUnit(current, simulated);

      const boardTarget = boardingTarget(unitPlan.actions);

      if (boardTarget) {
        current = loadPassenger(current, unit.id, boardTarget);
      }
    }
  }

  return current;
}

export function boardingTarget(actions: readonly PlanAction[]): string | undefined {
  const last = actions[actions.length - 1];

  return last?.kind === 'board' ? last.targetId : undefined;
}
