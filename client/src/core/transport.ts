import { hexNeighbors, type HexCoord } from './map/layout';
import { getMoveCost, getMovePath } from './map/movement';
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

export function unloadCargo(state: GameState, faction: Unit['faction']): GameState {
  const occupied = new Set(state.units.map((unit) => `${unit.pos.col},${unit.pos.row}`));
  const additions: Unit[] = [];
  let changed = false;

  const units = state.units.map((unit) => {
    if (unit.faction !== faction || cargoOf(unit).length === 0) {
      return unit;
    }

    const remaining: Unit[] = [];

    for (const passenger of cargoOf(unit)) {
      const target = unloadTarget(state, unit.pos, occupied);

      if (!target) {
        remaining.push(passenger);
        continue;
      }

      occupied.add(`${target.col},${target.row}`);
      additions.push({
        ...passenger,
        pos: target,
        movesLeft: UNIT_DEFS[passenger.kind].moveRange,
        hasActed: false,
      });
      changed = true;
    }

    if (remaining.length === cargoOf(unit).length) {
      return unit;
    }

    return remaining.length > 0
      ? { ...unit, cargo: remaining }
      : { ...unit, cargo: undefined };
  });

  return changed ? { ...state, units: [...units, ...additions] } : state;
}

function unloadTarget(
  state: GameState,
  origin: HexCoord,
  occupied: ReadonlySet<string>,
): HexCoord | undefined {
  for (const coord of hexNeighbors(origin)) {
    if (!occupied.has(`${coord.col},${coord.row}`) && getMoveCost(state, coord) < IMPASSABLE) {
      return coord;
    }
  }

  return undefined;
}
