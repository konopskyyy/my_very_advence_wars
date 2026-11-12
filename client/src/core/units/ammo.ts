import { UNIT_DEFS, type Unit } from './model';
import type { UnitStats } from './types';

const SHOT_EPSILON = 1e-9;
const UNARMED_SHOT_MOVE_COST = 1;

export function shotMoveCost(stats: UnitStats): number {
  return stats.ammo === undefined
    ? UNARMED_SHOT_MOVE_COST
    : stats.moveRange / stats.ammo;
}

export function shotsLeft(unit: Unit): number {
  if (unit.hasActed) {
    return 0;
  }

  const cost = shotMoveCost(UNIT_DEFS[unit.kind]);

  return Math.max(0, Math.floor((unit.movesLeft + SHOT_EPSILON) / cost));
}

export function applyAttackCost(unit: Unit): Unit {
  const cost = shotMoveCost(UNIT_DEFS[unit.kind]);
  const movesLeft = unit.movesLeft - cost;
  const exhausted = movesLeft <= SHOT_EPSILON;

  return {
    ...unit,
    movesLeft: exhausted ? 0 : movesLeft,
    hasActed: exhausted,
  };
}
