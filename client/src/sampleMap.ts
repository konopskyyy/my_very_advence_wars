import type { Hex } from './core/hex';
import { hexDistance } from './core/hex';
import { Terrain, type HexTile } from './core/terrain';
import { isBoardHex } from './hexLayout';

interface Region {
  terrain: Terrain;
  center: Hex;
  radius: number;
}

// Każdy region to środek + promień, poza nim równina. Bez losowości — ta sama
// mapa w każdym uruchomieniu (potrzebne dla testów).
const REGIONS: readonly Region[] = [
  { terrain: Terrain.Water, center: { q: 8, r: 4 }, radius: 2 },
  { terrain: Terrain.Water, center: { q: 24, r: 14 }, radius: 2 },
  { terrain: Terrain.Water, center: { q: 36, r: 8 }, radius: 1 },
  { terrain: Terrain.Forest, center: { q: 21, r: 1 }, radius: 2 },
  { terrain: Terrain.Forest, center: { q: 7, r: 9 }, radius: 2 },
  { terrain: Terrain.Forest, center: { q: 31, r: 5 }, radius: 1 },
  { terrain: Terrain.Forest, center: { q: 38, r: 12 }, radius: 2 },
  { terrain: Terrain.Mountain, center: { q: 17, r: 7 }, radius: 2 },
  { terrain: Terrain.Mountain, center: { q: 3, r: 13 }, radius: 2 },
  { terrain: Terrain.Mountain, center: { q: 29, r: 9 }, radius: 1 },
  { terrain: Terrain.City, center: { q: 14, r: 4 }, radius: 0 },
  { terrain: Terrain.City, center: { q: 4, r: 6 }, radius: 0 },
  { terrain: Terrain.City, center: { q: 26, r: 2 }, radius: 0 },
  { terrain: Terrain.City, center: { q: 35, r: 11 }, radius: 0 },
];

const DEFAULT_TERRAIN = Terrain.Plains;

// `undefined` = heksa nie ma na planszy. Dzięki temu reguły ruchu w `core/`
// odrzucają ruch poza mapę, a warstwa widoku nie musi znać granic planszy.
export function terrainAt(hex: Hex): Terrain | undefined {
  if (!isBoardHex(hex)) return undefined;

  for (const region of REGIONS) {
    if (hexDistance(region.center, hex) <= region.radius) return region.terrain;
  }
  return DEFAULT_TERRAIN;
}

export function tileAt(hex: Hex): HexTile | undefined {
  const terrain = terrainAt(hex);
  return terrain === undefined ? undefined : { hex, terrain };
}

export const TANK_START: Hex = { q: 16, r: 2 };
