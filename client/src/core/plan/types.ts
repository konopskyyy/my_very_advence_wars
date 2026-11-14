import type { HexCoord } from '../map';
import type { FactionId } from '../units';

export interface PlanMove {
  readonly kind: 'move';
  readonly path: readonly HexCoord[];
}

export interface PlanAttack {
  readonly kind: 'attack';
  readonly targetId: string;
}

export interface PlanBoard {
  readonly kind: 'board';
  readonly targetId: string;
  readonly path: readonly HexCoord[];
}

export type PlanAction = PlanMove | PlanAttack | PlanBoard;

export interface UnitPlan {
  readonly unitId: string;
  readonly actions: readonly PlanAction[];
}

export interface TurnPlan {
  readonly faction: FactionId;
  readonly turn: number;
  readonly units: readonly UnitPlan[];
}

export type PlanError =
  | 'unknown-unit'
  | 'wrong-faction'
  | 'invalid-action'
  | 'unreachable'
  | 'occupied-target'
  | 'no-target'
  | 'friendly-target'
  | 'no-shots'
  | 'out-of-range'
  | 'not-carrier'
  | 'cargo-full'
  | 'not-carried';

export type PlanEditResult =
  | { readonly ok: true; readonly plan: TurnPlan }
  | { readonly ok: false; readonly reason: PlanError };

export interface PlanHit {
  readonly attackerId: string;
  readonly targetId: string;
  readonly attackerPos: HexCoord;
  readonly targetPos: HexCoord;
  readonly damage: number;
  readonly order: number;
}
