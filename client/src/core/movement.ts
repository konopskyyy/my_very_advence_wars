import { hexEquals, hexNeighbors, isHexCoordinateValid } from './hex';
import type { Hex } from './hex';
import { Terrain } from './terrain';

const IMPASSABLE = new Set<Terrain>([Terrain.Water, Terrain.Mountain]);

export const isPassable = (terrain: Terrain): boolean => !IMPASSABLE.has(terrain);

export type MoveRejection = 'not-adjacent' | 'impassable' | 'out-of-bounds';

export interface MoveCheck {
  ok: boolean;
  reason?: MoveRejection;
}

export function canMoveTo(
  from: Hex,
  to: Hex,
  terrainAt: (hex: Hex) => Terrain | undefined,
): MoveCheck {
  if (!isHexCoordinateValid(to)) {
    return { ok: false, reason: 'out-of-bounds' };
  }

  if (!hexNeighbors(from).some((neighbor) => hexEquals(neighbor, to))) {
    return { ok: false, reason: 'not-adjacent' };
  }

  // `undefined` oznacza, że takiego heksa nie ma na mapie — ruch poza planszę.
  const terrain = terrainAt(to);
  if (terrain === undefined) {
    return { ok: false, reason: 'out-of-bounds' };
  }

  return isPassable(terrain) ? { ok: true } : { ok: false, reason: 'impassable' };
}
