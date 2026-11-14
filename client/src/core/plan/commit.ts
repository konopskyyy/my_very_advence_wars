import type { GameState } from '../state';
import { loadPassenger } from '../transport';
import { boardingTarget, simulateUnit } from './simulate';
import type { PlanHit, TurnPlan } from './types';
import { planVolley } from './volley';

export interface PlanCommit {
  readonly state: GameState;
  readonly hits: readonly PlanHit[];
  readonly killed: readonly string[];
}

export function commitPlan(state: GameState, plan: TurnPlan): PlanCommit {
  let current = state;

  for (const unitPlan of plan.units) {
    const unit = current.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const moved = simulateUnit(current, unit, unitPlan.actions);

    if (moved) {
      current = {
        ...current,
        units: current.units.map((candidate) =>
          candidate.id === moved.id ? moved : candidate,
        ),
      };

      const boardTarget = boardingTarget(unitPlan.actions);

      if (boardTarget) {
        current = loadPassenger(current, unit.id, boardTarget);
      }
    }
  }

  const volley = planVolley(state, plan);
  const units = current.units
    .map((unit) => {
      const damage = volley.damageByTarget.get(unit.id);

      if (!damage) {
        return unit;
      }

      return { ...unit, hp: Math.max(0, unit.hp - damage) };
    })
    .filter((unit) => unit.hp > 0);

  return {
    state: { ...current, units },
    hits: volley.hits,
    killed: volley.killed,
  };
}
