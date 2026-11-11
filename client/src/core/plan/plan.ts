import { canAttackThisTurn } from '../combat';
import { hexDistance, type HexCoord } from '../map/layout';
import { getMovePath } from '../map/movement';
import { cellKey } from '../map/model';
import type { GameState } from '../state';
import type { TurnState } from '../turn';
import { UNIT_DEFS, type Unit } from '../units';
import { simulateUnit, walkActions } from './simulate';
import type {
  PlanAction,
  PlanEditResult,
  PlanError,
  TurnPlan,
  UnitPlan,
} from './types';

export function createTurnPlan(turn: TurnState): TurnPlan {
  return { faction: turn.faction, turn: turn.turn, units: [] };
}

export function unitPlanOf(plan: TurnPlan, unitId: string): UnitPlan | undefined {
  return plan.units.find((candidate) => candidate.unitId === unitId);
}

export function unitActions(plan: TurnPlan, unitId: string): readonly PlanAction[] {
  return unitPlanOf(plan, unitId)?.actions ?? [];
}

function withActions(plan: TurnPlan, unitId: string, actions: readonly PlanAction[]): TurnPlan {
  const index = plan.units.findIndex((candidate) => candidate.unitId === unitId);

  if (actions.length === 0) {
    return { ...plan, units: plan.units.filter((candidate) => candidate.unitId !== unitId) };
  }

  if (index === -1) {
    return { ...plan, units: [...plan.units, { unitId, actions }] };
  }

  return {
    ...plan,
    units: plan.units.map((candidate, position) =>
      position === index ? { unitId, actions } : candidate,
    ),
  };
}

function fail(reason: PlanError): PlanEditResult {
  return { ok: false, reason };
}

function plannedUnit(state: GameState, plan: TurnPlan, unitId: string): Unit | undefined {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit) {
    return undefined;
  }

  const simulated = simulateUnit(state, unit, unitActions(plan, unitId));

  return simulated ?? unit;
}

function uniqueFinalPositions(plan: TurnPlan, state: GameState): boolean {
  const seen = new Set<string>();

  for (const unitPlan of plan.units) {
    const unit = plannedUnit(state, plan, unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const key = cellKey(unit.pos);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
  }

  return true;
}

export function setMove(
  plan: TurnPlan,
  state: GameState,
  unitId: string,
  target: HexCoord,
): PlanEditResult {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit) {
    return fail('unknown-unit');
  }

  if (unit.faction !== plan.faction) {
    return fail('wrong-faction');
  }

  const actions = unitActions(plan, unitId);
  const trailingMove = actions[actions.length - 1]?.kind === 'move';
  const baseActions = trailingMove ? actions.slice(0, -1) : actions;
  const base = walkActions(state, unit, baseActions);

  if (!base) {
    return fail('invalid-action');
  }

  const moveState: GameState = {
    ...state,
    units: state.units.map((candidate) => (candidate.id === base.id ? base : candidate)),
  };
  const path = getMovePath(moveState, base, target);

  if (!path) {
    return fail('unreachable');
  }

  const next = withActions(plan, unitId, [...baseActions, { kind: 'move', path }]);

  return uniqueFinalPositions(next, state) ? { ok: true, plan: next } : fail('occupied-target');
}

export function addAttack(
  plan: TurnPlan,
  state: GameState,
  unitId: string,
  targetId: string,
): PlanEditResult {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit) {
    return fail('unknown-unit');
  }

  if (unit.faction !== plan.faction) {
    return fail('wrong-faction');
  }

  const actions = unitActions(plan, unitId);
  const simulated = walkActions(state, unit, actions);

  if (!simulated) {
    return fail('invalid-action');
  }

  const target = state.units.find((candidate) => candidate.id === targetId);

  if (!target) {
    return fail('no-target');
  }

  if (target.id === simulated.id || target.faction === simulated.faction) {
    return fail('friendly-target');
  }

  if (!canAttackThisTurn(simulated)) {
    return fail('no-shots');
  }

  if (hexDistance(simulated.pos, target.pos) > UNIT_DEFS[simulated.kind].attackRange) {
    return fail('out-of-range');
  }

  return {
    ok: true,
    plan: withActions(plan, unitId, [...actions, { kind: 'attack', targetId }]),
  };
}

export function removeLastAction(plan: TurnPlan, unitId: string): TurnPlan {
  const actions = unitActions(plan, unitId);

  return withActions(plan, unitId, actions.slice(0, -1));
}

export function removeActionFrom(
  plan: TurnPlan,
  unitId: string,
  actionIndex: number,
): TurnPlan {
  const actions = unitActions(plan, unitId);

  if (actionIndex < 0 || actionIndex >= actions.length) {
    return plan;
  }

  return withActions(plan, unitId, actions.slice(0, actionIndex));
}

export function clearUnit(plan: TurnPlan, unitId: string): TurnPlan {
  return withActions(plan, unitId, []);
}

export function hasPlan(plan: TurnPlan): boolean {
  return plan.units.some((unitPlan) => unitPlan.actions.length > 0);
}

export function planState(state: GameState, plan: TurnPlan, unitId: string): Unit | undefined {
  return plannedUnit(state, plan, unitId);
}
