import type { Hex } from './hex';

export enum Terrain {
  Plains = 'plains',
  Forest = 'forest',
  Mountain = 'mountain',
  Water = 'water',
  City = 'city',
}

export interface HexTile {
  hex: Hex;
  terrain: Terrain;
}

interface TerrainArts {
  offsetX: number;
  offsetY: number;
  colors: readonly number[];
}

interface TerrainDefinition {
  color: number;
  arts: TerrainArts;
}

export const TERRAIN_ART: Record<Terrain, TerrainDefinition> = {
  [Terrain.Plains]: {
    color: 0x4d8261,
    arts: {
      offsetX: 7,
      offsetY: 12,
      colors: [0x7fc07a],
    },
  },
  [Terrain.Forest]: {
    color: 0x2f5d3a,
    arts: {
      offsetX: 4,
      offsetY: 4,
      colors: [0xe07b39],
    },
  },
  [Terrain.Mountain]: {
    color: 0x6b6152,
    arts: {
      offsetX: 0,
      offsetY: -4,
      colors: [0x8a8577, 0xb9b3a3],
    },
  },
  [Terrain.Water]: {
    color: 0x2a5d8f,
    arts: {
      offsetX: 4,
      offsetY: -4,
      colors: [0x3d7ab5, 0x2a5d8f],
    },
  },
  [Terrain.City]: {
    color: 0x6b6f75,
    arts: {
      offsetX: 4,
      offsetY: -8,
      colors: [0x9aa0a6, 0xd7d9db],
    },
  },
};
