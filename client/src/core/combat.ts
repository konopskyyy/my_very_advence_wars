import { hexDistance } from './map/layout';
import type { GameState } from './state';
import { UNIT_DEFS, type Unit } from './units';

export function canAttack(attacker: Unit, target: Unit): boolean {
  if (attacker.id === target.id || attacker.faction === target.faction) {
    return false;
  }

  if (attacker.hasActed) {
    return false;
  }

  return hexDistance(attacker.pos, target.pos) <= UNIT_DEFS[attacker.kind].attackRange;
}

export function attackUnit(state: GameState, attackerId: string, targetId: string): GameState {
  const attacker = state.units.find((unit) => unit.id === attackerId);
  const target = state.units.find((unit) => unit.id === targetId);

  if (!attacker || !target || !canAttack(attacker, target)) {
    return state;
  }

  const hp = target.hp - UNIT_DEFS[attacker.kind].attack;
  const units = state.units
    .filter((unit) => unit.id !== target.id || hp > 0)
    .map((unit) => {
      if (unit.id === attacker.id) {
        return { ...unit, hasActed: true };
      }

      if (unit.id === target.id) {
        return { ...unit, hp };
      }

      return unit;
    });

  return { ...state, units };
}
