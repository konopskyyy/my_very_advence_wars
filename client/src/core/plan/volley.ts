import type { GameState } from '../state';
import { loadPassenger } from '../transport';
import { UNIT_DEFS } from '../units';
import { boardingTarget, walkActions } from './simulate';
import type { PlanHit, TurnPlan } from './types';

export interface VolleyPlan {
  readonly hits: readonly PlanHit[];
  readonly damageByTarget: ReadonlyMap<string, number>;
  readonly killed: readonly string[];
}

export function planVolley(state: GameState, plan: TurnPlan): VolleyPlan {
  const hits: PlanHit[] = [];
  const damageByTarget = new Map<string, number>();
  let current = state;

  for (const unitPlan of plan.units) {
    const unit = current.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const simulated = walkActions(current, unit, unitPlan.actions, (step) => {
      const action = step.action;

      if (action.kind !== 'attack') {
        return;
      }

      const target = current.units.find((candidate) => candidate.id === action.targetId);

      if (!target) {
        return;
      }

      const damage = UNIT_DEFS[unit.kind].attack;

      hits.push({
        attackerId: unit.id,
        targetId: target.id,
        attackerPos: step.before.pos,
        targetPos: target.pos,
        damage,
        order: hits.length,
      });
      damageByTarget.set(target.id, (damageByTarget.get(target.id) ?? 0) + damage);
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
  }

  const killed = state.units
    .filter((unit) => (damageByTarget.get(unit.id) ?? 0) >= unit.hp)
    .map((unit) => unit.id);

  return { hits, damageByTarget, killed };
}
