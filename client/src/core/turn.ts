import type { GameState } from './state';
import { UNIT_DEFS, type FactionId } from './units';

export const TURN_ORDER: readonly FactionId[] = ['blue', 'red'];

export interface TurnState {
  readonly faction: FactionId;
  readonly turn: number;
}

export function createTurnState(faction: FactionId = TURN_ORDER[0]!): TurnState {
  return { faction, turn: 1 };
}

export function nextTurn(turn: TurnState): TurnState {
  const index = TURN_ORDER.indexOf(turn.faction);

  return {
    faction: TURN_ORDER[(index + 1) % TURN_ORDER.length]!,
    turn: turn.turn + 1,
  };
}

export function beginTurn(state: GameState, faction: FactionId): GameState {
  let changed = false;
  const units = state.units.map((unit) => {
    if (unit.faction !== faction) {
      return unit;
    }

    const movesLeft = UNIT_DEFS[unit.kind].moveRange;

    if (unit.movesLeft === movesLeft && !unit.hasActed) {
      return unit;
    }

    changed = true;

    return { ...unit, movesLeft, hasActed: false };
  });

  return changed ? { ...state, units } : state;
}

export function isActiveFaction(turn: TurnState, faction: FactionId): boolean {
  return turn.faction === faction;
}
