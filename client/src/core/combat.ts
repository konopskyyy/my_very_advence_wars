import { hexDistance } from './map/layout';
import type { GameState } from './state';
import {
  ARTILLERY_SHOT_MOVE_COST,
  shotsLeft,
  UNIT_DEFS,
  type Unit,
} from './units';

const MOVE_EPSILON = 1e-9;

export function canAttackThisTurn(unit: Unit): boolean {
  if (unit.hasActed) {
    return false;
  }

  return shotsLeft(unit) > 0;
}

export function canAttack(attacker: Unit, target: Unit): boolean {
  if (attacker.id === target.id || attacker.faction === target.faction) {
    return false;
  }

  if (!canAttackThisTurn(attacker)) {
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
        if (attacker.kind === 'artillery') {
          const movesLeft = attacker.movesLeft - ARTILLERY_SHOT_MOVE_COST;
          const exhausted = movesLeft <= MOVE_EPSILON;

          return {
            ...unit,
            movesLeft: exhausted ? 0 : movesLeft,
            hasActed: exhausted,
          };
        }

        return { ...unit, hasActed: true };
      }

      if (unit.id === target.id) {
        return { ...unit, hp };
      }

      return unit;
    });

  return { ...state, units };
}
