import type { GameState } from '../state';
import type { Unit } from '../units';
import { simulateUnit } from './simulate';
import type { PlanHit, TurnPlan } from './types';
import { planVolley } from './volley';

export interface PlanCommit {
  readonly state: GameState;
  readonly hits: readonly PlanHit[];
  readonly killed: readonly string[];
}

export function commitPlan(state: GameState, plan: TurnPlan): PlanCommit {
  const simulated = new Map<string, Unit>();

  for (const unitPlan of plan.units) {
    const unit = state.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const moved = simulateUnit(state, unit, unitPlan.actions);

    if (moved) {
      simulated.set(unit.id, moved);
    }
  }

  const volley = planVolley(state, plan);
  const units = state.units
    .map((unit) => simulated.get(unit.id) ?? unit)
    .map((unit) => {
      const damage = volley.damageByTarget.get(unit.id);

      if (!damage) {
        return unit;
      }

      return { ...unit, hp: Math.max(0, unit.hp - damage) };
    })
    .filter((unit) => unit.hp > 0);

  return {
    state: { ...state, units },
    hits: volley.hits,
    killed: volley.killed,
  };
}
