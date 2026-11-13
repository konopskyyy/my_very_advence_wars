import { cellKey, type HexCoord } from './map';
import { hexDistance } from './map/layout';
import { hexesInRange, visionTiles } from './ranges';
import type { GameState } from './state';
import { UNIT_DEFS, type FactionId, type Unit } from './units';

export interface VisionPoint {
  readonly pos: HexCoord;
  readonly range: number;
}

export function isUnitVisible(
  state: GameState,
  unit: Unit,
  viewer: FactionId,
  sight?: VisionPoint,
): boolean {
  if (!state.map.fogOfWar || unit.faction === viewer) {
    return true;
  }

  return (
    state.units.some(
      (spotter) =>
        spotter.faction === viewer &&
        hexDistance(spotter.pos, unit.pos) <= UNIT_DEFS[spotter.kind].visionRange,
    ) ||
    (sight !== undefined &&
      hexDistance(sight.pos, unit.pos) <= sight.range)
  );
}

export function visibleTileKeys(
  state: GameState,
  viewer: FactionId,
  sight?: VisionPoint,
): Set<string> {
  const keys = new Set<string>();

  for (const unit of state.units) {
    if (unit.faction !== viewer) {
      continue;
    }

    keys.add(cellKey(unit.pos));

    for (const coord of visionTiles(state.map, unit)) {
      keys.add(cellKey(coord));
    }
  }

  if (sight) {
    keys.add(cellKey(sight.pos));

    for (const coord of hexesInRange(state.map, sight.pos, sight.range)) {
      keys.add(cellKey(coord));
    }
  }

  return keys;
}

export function visibleUnits(
  state: GameState,
  viewer: FactionId,
  sight?: VisionPoint,
): Unit[] {
  if (!state.map.fogOfWar) {
    return [...state.units];
  }

  return state.units.filter((unit) => isUnitVisible(state, unit, viewer, sight));
}

export function visibleUnitAt(
  state: GameState,
  coord: HexCoord,
  viewer: FactionId,
  sight?: VisionPoint,
): Unit | undefined {
  return state.units.find(
    (unit) =>
      unit.pos.col === coord.col &&
      unit.pos.row === coord.row &&
      isUnitVisible(state, unit, viewer, sight),
  );
}
