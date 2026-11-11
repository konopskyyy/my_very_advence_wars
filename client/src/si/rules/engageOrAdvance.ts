import { canAttackThisTurn } from '../../core/combat';
import { hexDistance, moveTargets, type HexCoord } from '../../core/map';
import { addAttack, setMove, type TurnPlan } from '../../core/plan';
import type { GameState } from '../../core/state';
import { UNIT_DEFS, type Unit } from '../../core/units';
import { visibleUnits } from '../../core/vision';
import { SiRule } from '../rule';
import type { SiContext } from '../types';

export const ENGAGE_OR_ADVANCE_PRIORITY = 100;

export class EngageOrAdvanceRule extends SiRule {
  readonly priority = ENGAGE_OR_ADVANCE_PRIORITY;

  canBeUsed(context: SiContext): boolean {
    return canAttackThisTurn(context.unit) || moveTargets(context.state, context.unit).length > 0;
  }

  perform(context: SiContext): TurnPlan {
    const target = nearestVisibleEnemy(context);

    return target ? engage(context, target) : advance(context);
  }
}

function nearestVisibleEnemy(context: SiContext): Unit | undefined {
  return visibleUnits(context.state, context.unit.faction)
    .filter((candidate) => candidate.faction !== context.unit.faction)
    .sort((left, right) => compareByDistance(left.pos, right.pos, context.unit.pos))[0];
}

function engage(context: SiContext, target: Unit): TurnPlan {
  const range = UNIT_DEFS[context.unit.kind].attackRange;

  if (hexDistance(context.unit.pos, target.pos) <= range) {
    return canAttackThisTurn(context.unit)
      ? attack(context.plan, context.state, context.unit.id, target.id)
      : context.plan;
  }

  const destination = approachTarget(
    context.unit,
    target,
    moveTargets(context.state, context.unit),
  );

  if (!destination) {
    return context.plan;
  }

  const moved = setMove(context.plan, context.state, context.unit.id, destination);

  if (!moved.ok) {
    return context.plan;
  }

  return attack(moved.plan, context.state, context.unit.id, target.id);
}

function approachTarget(
  unit: Unit,
  target: Unit,
  reachable: readonly HexCoord[],
): HexCoord | undefined {
  const currentDistance = hexDistance(unit.pos, target.pos);
  const destination = [...reachable].sort((left, right) =>
    compareByDistance(left, right, target.pos),
  )[0];

  if (!destination || hexDistance(destination, target.pos) >= currentDistance) {
    return undefined;
  }

  return destination;
}

function advance(context: SiContext): TurnPlan {
  const currentDistance = hexDistance(context.unit.pos, context.spawn);
  const destination = [...moveTargets(context.state, context.unit)].sort((left, right) => {
    const distance =
      hexDistance(right, context.spawn) - hexDistance(left, context.spawn);

    return distance !== 0 ? distance : compareByDistance(left, right, context.spawn);
  })[0];

  if (!destination || hexDistance(destination, context.spawn) <= currentDistance) {
    return context.plan;
  }

  const moved = setMove(context.plan, context.state, context.unit.id, destination);

  return moved.ok ? moved.plan : context.plan;
}

function attack(
  plan: TurnPlan,
  state: GameState,
  attackerId: string,
  targetId: string,
): TurnPlan {
  const result = addAttack(plan, state, attackerId, targetId);

  return result.ok ? result.plan : plan;
}

function compareByDistance(left: HexCoord, right: HexCoord, origin: HexCoord): number {
  const distance = hexDistance(left, origin) - hexDistance(right, origin);

  if (distance !== 0) {
    return distance;
  }

  if (left.col !== right.col) {
    return left.col - right.col;
  }

  return left.row - right.row;
}
