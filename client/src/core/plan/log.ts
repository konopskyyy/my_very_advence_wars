import type { HexCoord } from '../map';
import type { GameState } from '../state';
import { cargoOf, loadPassenger, unloadPassenger } from '../transport';
import type { UnitKind } from '../units';
import type { PlanCommit } from './commit';
import { boardingTarget, unloadAction, walkActions } from './simulate';
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
  let current = stateBefore;

  for (const unitPlan of plan.units) {
    const unit = current.units.find((candidate) => candidate.id === unitPlan.unitId);

    if (!unit) {
      continue;
    }

    const simulated = walkActions(current, unit, unitPlan.actions, (step) => {
      const action = step.action;

      if (action.kind === 'unload') {
        const passenger = cargoOf(step.before).find(
          (candidate) => candidate.id === action.passengerId,
        );

        if (passenger) {
          moves.push({
            unitId: passenger.id,
            kind: passenger.kind,
            from: step.before.pos,
            to: action.target,
          });
        }

        return;
      }

      if ((action.kind !== 'move' && action.kind !== 'board') || action.path.length === 0) {
        return;
      }

      moves.push({
        unitId: unit.id,
        kind: unit.kind,
        from: step.before.pos,
        to: step.after.pos,
      });
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

      const unload = unloadAction(unitPlan.actions);

      if (unload) {
        current = unloadPassenger(current, unit.id, unload.passengerId, unload.target);
      }
    }
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
