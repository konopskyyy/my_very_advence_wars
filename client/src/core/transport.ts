import { hexDistance, hexNeighbors, type HexCoord } from './map/layout';
import { findUnitAt, getMoveCost, getMovePath } from './map/movement';
import { IMPASSABLE } from './map/terrain';
import type { GameState } from './state';
import { UNIT_DEFS, type Unit } from './units';

export function cargoOf(unit: Unit): readonly Unit[] {
  return unit.cargo ?? [];
}

export function cargoCount(unit: Unit): number {
  return cargoOf(unit).length;
}

export function freeCargoSlots(unit: Unit): number {
  return Math.max(0, (UNIT_DEFS[unit.kind].capacity ?? 0) - cargoCount(unit));
}

export function canCarry(vehicle: Unit, passenger: Unit): boolean {
  if (vehicle.id === passenger.id || vehicle.faction !== passenger.faction) {
    return false;
  }

  const stats = UNIT_DEFS[vehicle.kind];

  return (
    freeCargoSlots(vehicle) > 0 &&
    (stats.carries ?? []).includes(passenger.kind)
  );
}

export function canBoard(vehicle: Unit, passenger: Unit): boolean {
  return canCarry(vehicle, passenger) && !passenger.hasActed && passenger.movesLeft > 0;
}

export function boardingPath(
  state: GameState,
  passenger: Unit,
  vehicle: Unit,
): HexCoord[] | undefined {
  if (!canBoard(vehicle, passenger)) {
    return undefined;
  }

  return getMovePath(state, passenger, vehicle.pos, vehicle.id);
}

export function loadPassenger(
  state: GameState,
  passengerId: string,
  vehicleId: string,
): GameState {
  const passenger = state.units.find((unit) => unit.id === passengerId);
  const vehicle = state.units.find((unit) => unit.id === vehicleId);

  if (!passenger || !vehicle || !canCarry(vehicle, passenger)) {
    return state;
  }

  const loaded: Unit = {
    ...passenger,
    pos: vehicle.pos,
    movesLeft: 0,
    hasActed: true,
  };
  const units = state.units
    .filter((unit) => unit.id !== passengerId)
    .map((unit) =>
      unit.id === vehicleId
        ? { ...unit, cargo: [...cargoOf(unit), loaded] }
        : unit,
    );

  return { ...state, units };
}

export function unloadTargets(state: GameState, vehicle: Unit): HexCoord[] {
  return hexNeighbors(vehicle.pos).filter((coord) => canUnloadAt(state, coord));
}

export function canUnloadAt(state: GameState, target: HexCoord): boolean {
  if (findUnitAt(state, target)) {
    return false;
  }

  return getMoveCost(state, target) < IMPASSABLE;
}

export function unloadPassenger(
  state: GameState,
  vehicleId: string,
  passengerId: string,
  target: HexCoord,
): GameState {
  const vehicle = state.units.find((unit) => unit.id === vehicleId);
  const passenger = vehicle ? cargoOf(vehicle).find((unit) => unit.id === passengerId) : undefined;

  if (
    !vehicle ||
    !passenger ||
    hexDistance(vehicle.pos, target) !== 1 ||
    !canUnloadAt(state, target)
  ) {
    return state;
  }

  const remaining = cargoOf(vehicle).filter((unit) => unit.id !== passengerId);
  const units = state.units.map((unit) => {
    if (unit.id !== vehicleId) {
      return unit;
    }

    return remaining.length > 0
      ? { ...unit, cargo: remaining }
      : { ...unit, cargo: undefined };
  });

  return {
    ...state,
    units: [
      ...units,
      {
        ...passenger,
        pos: target,
        movesLeft: 0,
        hasActed: true,
      },
    ],
  };
}
