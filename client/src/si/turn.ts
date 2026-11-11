import type { HexCoord } from '../core/map';
import { createTurnPlan, type TurnPlan } from '../core/plan';
import type { GameState } from '../core/state';
import type { TurnState } from '../core/turn';
import { SI_RULES } from './rules';
import type { SiContext } from './types';

export type SiSpawns = ReadonlyMap<string, HexCoord>;

export function buildSiPlan(state: GameState, turn: TurnState, spawns: SiSpawns): TurnPlan {
  let plan = createTurnPlan(turn);

  for (const unit of state.units) {
    if (unit.faction !== turn.faction) {
      continue;
    }

    const context: SiContext = {
      state,
      plan,
      unit,
      spawn: spawns.get(unit.id) ?? unit.pos,
    };
    const rule = SI_RULES.find((candidate) => candidate.canBeUsed(context));

    if (rule) {
      plan = rule.perform(context);
    }
  }

  return plan;
}
