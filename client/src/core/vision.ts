import { cellKey, type HexCoord } from './map';
import { hexDistance } from './map/layout';
import { visionTiles } from './ranges';
import type { GameState } from './state';
import { UNIT_DEFS, type FactionId, type Unit } from './units';

export function isUnitVisible(state: GameState, unit: Unit, viewer: FactionId): boolean {
  if (!state.map.fogOfWar || unit.faction === viewer) {
    return true;
  }

  return state.units.some(
    (spotter) =>
      spotter.faction === viewer &&
      hexDistance(spotter.pos, unit.pos) <= UNIT_DEFS[spotter.kind].visionRange,
  );
}

export function visibleTileKeys(state: GameState, viewer: FactionId): Set<string> {
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

  return keys;
}

export function visibleUnits(state: GameState, viewer: FactionId): Unit[] {
  if (!state.map.fogOfWar) {
    return [...state.units];
  }

  return state.units.filter((unit) => isUnitVisible(state, unit, viewer));
}

export function visibleUnitAt(
  state: GameState,
  coord: HexCoord,
  viewer: FactionId,
): Unit | undefined {
  return state.units.find(
    (unit) =>
      unit.pos.col === coord.col &&
      unit.pos.row === coord.row &&
      isUnitVisible(state, unit, viewer),
  );
}
