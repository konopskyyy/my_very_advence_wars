import { cellKey, hexDistance, hexNeighbors, type GameMap, type HexCoord } from './map';
import { IMPASSABLE, TERRAIN_DEFS } from './terrain';
import type { FactionId, Unit, UnitKind } from './units';
import { createUnit } from './units';

export interface GameState {
  readonly map: GameMap;
  readonly units: readonly Unit[];
  readonly nextUnitSeq: number;
}

export interface UnitDeployment {
  readonly kind: UnitKind;
  readonly col: number;
  readonly row: number;
}

export interface FactionCounts {
  readonly blue: number;
  readonly red: number;
  readonly total: number;
}

export function createInitialState(map: GameMap): GameState {
  return { map, units: [], nextUnitSeq: 1 };
}

export function findUnitAt(state: GameState, coord: HexCoord): Unit | undefined {
  return state.units.find((unit) => unit.pos.col === coord.col && unit.pos.row === coord.row);
}

export function placeUnit(
  state: GameState,
  kind: UnitKind,
  coord: HexCoord,
  faction: FactionId,
): GameState {
  const unit = createUnit(`u${state.nextUnitSeq}`, kind, faction, coord);
  const others = state.units.filter(
    (other) => other.pos.col !== coord.col || other.pos.row !== coord.row,
  );

  return { ...state, units: [...others, unit], nextUnitSeq: state.nextUnitSeq + 1 };
}

export function removeUnitAt(state: GameState, coord: HexCoord): GameState {
  const units = state.units.filter((unit) => unit.pos.col !== coord.col || unit.pos.row !== coord.row);

  return units.length === state.units.length ? state : { ...state, units };
}

export function clearUnits(state: GameState): GameState {
  return state.units.length === 0 ? state : { ...state, units: [] };
}

export function canMoveUnit(state: GameState, unit: Unit, target: HexCoord): boolean {
  if (unit.hasActed || unit.movesLeft <= 0) {
    return false;
  }

  if (hexDistance(unit.pos, target) !== 1) {
    return false;
  }

  if (findUnitAt(state, target)) {
    return false;
  }

  const terrain = state.map.cells[cellKey(target)];

  return terrain !== undefined && TERRAIN_DEFS[terrain].moveCost < IMPASSABLE;
}

export function moveTargets(state: GameState, unit: Unit): HexCoord[] {
  return hexNeighbors(unit.pos).filter((target) => canMoveUnit(state, unit, target));
}

export function moveUnit(state: GameState, unitId: string, target: HexCoord): GameState {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit || !canMoveUnit(state, unit, target)) {
    return state;
  }

  const units = state.units.map((candidate) =>
    candidate.id === unitId
      ? { ...candidate, pos: target, movesLeft: 0, hasActed: true }
      : candidate,
  );

  return { ...state, units };
}

export function deployUnits(
  state: GameState,
  faction: FactionId,
  deployment: readonly UnitDeployment[],
): GameState {
  return deployment.reduce(
    (next, { kind, col, row }) => placeUnit(next, kind, { col, row }, faction),
    state,
  );
}

export function countUnits(units: readonly Unit[]): FactionCounts {
  let blue = 0;
  let red = 0;

  for (const unit of units) {
    if (unit.faction === 'blue') {
      blue += 1;
    } else {
      red += 1;
    }
  }

  return { blue, red, total: blue + red };
}
