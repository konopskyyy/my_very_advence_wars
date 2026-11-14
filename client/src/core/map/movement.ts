import type { GameState } from '../state';
import type { Unit } from '../units';
import { hexDistance, hexNeighbors, type HexCoord } from './layout';
import { cellCoord, cellKey } from './model';
import { IMPASSABLE, TERRAIN_DEFS } from './terrain';

const MOVE_EPSILON = 1e-9;

export function findUnitAt(state: GameState, coord: HexCoord): Unit | undefined {
  return state.units.find((unit) => unit.pos.col === coord.col && unit.pos.row === coord.row);
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

export function getMovePath(
  state: GameState,
  unit: Unit,
  target: HexCoord,
  allowOccupantId?: string,
): HexCoord[] | undefined {
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

  if (unitAtTarget && unitAtTarget.id !== unit.id && unitAtTarget.id !== allowOccupantId) {
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

      if (
        occupant &&
        !(isTarget && (occupant.id === unit.id || occupant.id === allowOccupantId))
      ) {
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

    path.push(cellCoord(currentKey));
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

export function canMoveNow(state: GameState, unit: Unit): boolean {
  if (unit.hasActed || unit.movesLeft <= 0) {
    return false;
  }

  return moveTargets(state, unit).length > 0;
}

export function moveUnitStep(state: GameState, unitId: string, target: HexCoord): GameState {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit || !canMoveUnit(state, unit, target)) {
    return state;
  }

  const movesLeft = unit.movesLeft - getMoveCost(state, target);
  const exhausted = movesLeft <= MOVE_EPSILON;
  const units = state.units.map((candidate) =>
    candidate.id === unitId
      ? {
          ...candidate,
          pos: target,
          movesLeft: exhausted ? 0 : movesLeft,
          hasActed: exhausted,
        }
      : candidate,
  );

  return { ...state, units };
}

export function settleUnitMovement(state: GameState, unitId: string): GameState {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit || unit.hasActed || canMoveNow(state, unit)) {
    return state;
  }

  return {
    ...state,
    units: state.units.map((candidate) =>
      candidate.id === unitId
        ? { ...candidate, movesLeft: 0, hasActed: true }
        : candidate,
    ),
  };
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

  return path.reduce((next, coord) => moveUnitStep(next, unitId, coord), state);
}
