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

export function getMoveCost(state: GameState, coord: HexCoord): number {
  const terrain = state.map.cells[cellKey(coord)];

  if (terrain === undefined) {
    return IMPASSABLE;
  }

  return TERRAIN_DEFS[terrain].moveCost;
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

  const moveCost = getMoveCost(state, target);

  if (moveCost >= IMPASSABLE) {
    return false;
  }

  return moveCost <= unit.movesLeft;
}

export function getMovePath(state: GameState, unit: Unit, target: HexCoord): HexCoord[] | undefined {
  if (unit.hasActed || unit.movesLeft <= 0) {
    return undefined;
  }

  if (target.col === unit.pos.col && target.row === unit.pos.row) {
    return undefined;
  }

  const moveCostTarget = getMoveCost(state, target);

  if (moveCostTarget >= IMPASSABLE) {
    return undefined;
  }

  const unitAtTarget = findUnitAt(state, target);

  if (unitAtTarget && unitAtTarget.id !== unit.id) {
    return undefined;
  }

  const costs = new Map<string, number>();
  const parents = new Map<string, string>();
  const startKey = cellKey(unit.pos);
  costs.set(startKey, 0);

  const queue: Array<{ coord: HexCoord; cost: number }> = [{ coord: unit.pos, cost: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of hexNeighbors(current.coord)) {
      const cost = getMoveCost(state, neighbor);

      if (cost >= IMPASSABLE) {
        continue;
      }

      const neighborKey = cellKey(neighbor);
      const isTarget = neighbor.col === target.col && neighbor.row === target.row;
      const occupant = findUnitAt(state, neighbor);

      if (occupant && !(isTarget && occupant.id === unit.id)) {
        continue;
      }

      const nextCost = current.cost + cost;

      if (nextCost > unit.movesLeft) {
        continue;
      }

      const existing = costs.get(neighborKey);

      if (existing === undefined || nextCost < existing) {
        costs.set(neighborKey, nextCost);
        parents.set(neighborKey, cellKey(current.coord));
        queue.push({ coord: neighbor, cost: nextCost });
      }
    }
  }

  const targetKey = cellKey(target);

  if (!costs.has(targetKey)) {
    return undefined;
  }

  const path: HexCoord[] = [];
  let currentKey = targetKey;

  while (currentKey !== startKey) {
    const parent = parents.get(currentKey);

    if (!parent) {
      return undefined;
    }

    const parts = currentKey.split(',');
    path.push({ col: Number(parts[0]), row: Number(parts[1]) });
    currentKey = parent;
  }

  path.reverse();

  return path;
}

export function moveTargets(state: GameState, unit: Unit): HexCoord[] {
  if (unit.hasActed || unit.movesLeft <= 0) {
    return [];
  }

  const targets = new Map<string, HexCoord>();
  const costs = new Map<string, number>();
  const startKey = cellKey(unit.pos);
  costs.set(startKey, 0);

  const queue: Array<{ coord: HexCoord; cost: number }> = [{ coord: unit.pos, cost: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of hexNeighbors(current.coord)) {
      const cost = getMoveCost(state, neighbor);

      if (cost >= IMPASSABLE) {
        continue;
      }

      if (findUnitAt(state, neighbor)) {
        continue;
      }

      const nextCost = current.cost + cost;

      if (nextCost > unit.movesLeft) {
        continue;
      }

      const key = cellKey(neighbor);
      const existing = costs.get(key);

      if (existing === undefined || nextCost < existing) {
        costs.set(key, nextCost);
        targets.set(key, neighbor);
        queue.push({ coord: neighbor, cost: nextCost });
      }
    }
  }

  return Array.from(targets.values());
}

export function moveUnit(state: GameState, unitId: string, target: HexCoord): GameState {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit || unit.hasActed || unit.movesLeft <= 0) {
    return state;
  }

  const path = getMovePath(state, unit, target);

  if (!path) {
    return state;
  }

  let totalCost = 0;

  for (const coord of path) {
    totalCost += getMoveCost(state, coord);
  }

  if (totalCost > unit.movesLeft) {
    return state;
  }

  const units = state.units.map((candidate) =>
    candidate.id === unitId
      ? { ...candidate, pos: target, movesLeft: unit.movesLeft - totalCost, hasActed: unit.movesLeft - totalCost === 0 }
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
