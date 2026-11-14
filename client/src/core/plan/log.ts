import type { HexCoord } from '../map';
import type { GameState } from '../state';
import type { UnitKind } from '../units';
import type { PlanCommit } from './commit';
import { walkActions } from './simulate';
import type { TurnPlan } from './types';

export interface TurnLogMove {
  readonly unitId: string;
  readonly kind: UnitKind;
  readonly from: HexCoord;
  readonly to: HexCoord;
}

export interface TurnLogAttack {
  readonly unitId: string;
  readonly unitKind: UnitKind;
  readonly targetId: string;
  readonly targetKind: UnitKind;
  readonly damage: number;
  readonly killed: boolean;
}

export interface TurnLog {
  readonly turn: number;
  readonly faction: TurnPlan['faction'];
  readonly moves: readonly TurnLogMove[];
  readonly attacks: readonly TurnLogAttack[];
  readonly damageTotal: number;
}

export function buildTurnLog(
  plan: TurnPlan,
  stateBefore: GameState,
  commit: Pick<PlanCommit, 'hits' | 'killed'>,
): TurnLog {
  const moves: TurnLogMove[] = [];

  for (const unitPlan of plan.units) {
    const unit = stateBefore.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    walkActions(stateBefore, unit, unitPlan.actions, (step) => {
      if (step.action.kind !== 'move' || step.action.path.length === 0) {
        return;
      }

      moves.push({
        unitId: unit.id,
        kind: unit.kind,
        from: step.before.pos,
        to: step.after.pos,
      });
    });
  }

  const killed = new Set(commit.killed);
  const attacks = commit.hits.map((hit): TurnLogAttack => {
    const attacker = stateBefore.units.find((unit) => unit.id === hit.attackerId);
    const target = stateBefore.units.find((unit) => unit.id === hit.targetId);

    return {
      unitId: hit.attackerId,
      unitKind: attacker?.kind ?? 'infantry',
      targetId: hit.targetId,
      targetKind: target?.kind ?? 'infantry',
      damage: hit.damage,
      killed: killed.has(hit.targetId),
    };
  });

  return {
    turn: plan.turn,
    faction: plan.faction,
    moves,
    attacks,
    damageTotal: attacks.reduce((total, attack) => total + attack.damage, 0),
  };
}
