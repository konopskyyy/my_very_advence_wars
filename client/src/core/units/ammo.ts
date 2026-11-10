import { UNIT_DEFS, type Unit } from './model';
import type { UnitStats } from './types';

const SHOT_EPSILON = 1e-9;

export function shotMoveCost(stats: UnitStats): number | undefined {
  return stats.ammo === undefined ? undefined : stats.moveRange / stats.ammo;
}

export function shotsLeft(unit: Unit): number {
  if (unit.hasActed) {
    return 0;
  }

  const cost = shotMoveCost(UNIT_DEFS[unit.kind]);

  if (cost === undefined) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor((unit.movesLeft + SHOT_EPSILON) / cost));
}
