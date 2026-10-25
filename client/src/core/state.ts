import type { GameMap, HexCoord } from './map';
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
