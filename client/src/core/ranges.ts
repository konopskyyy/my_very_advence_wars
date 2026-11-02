import { cellCoord, type GameMap, type HexCoord } from './map';
import { hexDistance } from './map/layout';
import { UNIT_DEFS, type Unit } from './units';

export function hexesInRange(map: GameMap, origin: HexCoord, radius: number): HexCoord[] {
  if (radius <= 0) {
    return [];
  }

  const result: HexCoord[] = [];

  for (const key of Object.keys(map.cells)) {
    const coord = cellCoord(key);
    const distance = hexDistance(origin, coord);

    if (distance > 0 && distance <= radius) {
      result.push(coord);
    }
  }

  return result;
}

export function visionTiles(map: GameMap, unit: Unit): HexCoord[] {
  return hexesInRange(map, unit.pos, UNIT_DEFS[unit.kind].visionRange);
}

export function attackTiles(map: GameMap, unit: Unit): HexCoord[] {
  return hexesInRange(map, unit.pos, UNIT_DEFS[unit.kind].attackRange);
}
