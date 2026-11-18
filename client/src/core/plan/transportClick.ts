import type { HexCoord } from '../map/layout';
import type { GameState } from '../state';
import { canCarry, cargoOf } from '../transport';
import type { Unit } from '../units';
import { setBoard, setUnload, unitActions } from './plan';
import type { PlanEditResult, TurnPlan } from './types';

export type TransportIntent =
  | {
      readonly kind: 'board';
      readonly passengerId: string;
      readonly vehicleId: string;
      readonly coord: HexCoord;
    }
  | {
      readonly kind: 'unload';
      readonly passengerId: string;
      readonly vehicleId: string;
      readonly coord: HexCoord;
      readonly target: HexCoord;
    };

export function transportIntent(
  plan: TurnPlan,
  state: GameState,
  selected: Unit | null,
  coord: HexCoord,
): TransportIntent | null {
  if (!selected || selected.faction !== plan.faction) {
    return null;
  }

  const target = state.units.find(
    (unit) => unit.pos.col === coord.col && unit.pos.row === coord.row,
  );

  if (target && target.faction === selected.faction && target.id !== selected.id) {
    if (canCarry(target, selected)) {
      return {
        kind: 'board',
        passengerId: selected.id,
        vehicleId: target.id,
        coord: target.pos,
      };
    }

    if (canCarry(selected, target)) {
      return {
        kind: 'board',
        passengerId: target.id,
        vehicleId: selected.id,
        coord: target.pos,
      };
    }

    return null;
  }

  if (!target && cargoOf(selected).length > 0 && unitActions(plan, selected.id).length === 0) {
    return {
      kind: 'unload',
      passengerId: cargoOf(selected)[0]!.id,
      vehicleId: selected.id,
      coord,
      target: coord,
    };
  }

  return null;
}

export function transportClick(
  plan: TurnPlan,
  state: GameState,
  selected: Unit | null,
  coord: HexCoord,
): PlanEditResult | null {
  const intent = transportIntent(plan, state, selected, coord);

  if (!intent) {
    return null;
  }

  return intent.kind === 'board'
    ? setBoard(plan, state, intent.passengerId, intent.vehicleId)
    : setUnload(plan, state, intent.vehicleId, intent.passengerId, intent.target);
}
