import type { GameState } from '../state';
import type { Unit } from '../units';
import { addAttack } from './plan';
import type { TurnPlan } from './types';

export interface AttackIntent {
  readonly unitId: string;
  readonly targetId: string;
}

export function attackIntent(
  plan: TurnPlan,
  state: GameState,
  selected: Unit | null,
  target: Unit | null,
): AttackIntent | null {
  if (
    !selected ||
    !target ||
    selected.faction !== plan.faction ||
    target.faction === selected.faction
  ) {
    return null;
  }

  return addAttack(plan, state, selected.id, target.id).ok
    ? { unitId: selected.id, targetId: target.id }
    : null;
}
