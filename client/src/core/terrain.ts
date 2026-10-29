export type TerrainId = 'plain' | 'forest' | 'water' | 'mountain' | 'swamp' | 'road' | 'city';

export interface TerrainDef {
  readonly label: string;
  readonly color: number;
  readonly moveCost: number;
  readonly defense: number;
}

export const IMPASSABLE = 99;

export const TERRAIN_DEFS: Record<TerrainId, TerrainDef> = {
  plain: { label: 'Łąka', color: 0x6f9e5c, moveCost: 1, defense: 0 },
  forest: { label: 'Las', color: 0x2f6b3a, moveCost: 2, defense: 20 },
  water: { label: 'Woda', color: 0x2f6ea8, moveCost: IMPASSABLE, defense: 0 },
  mountain: { label: 'Góry', color: 0x8a8577, moveCost: 3, defense: 30 },
  swamp: { label: 'Bagno', color: 0x5c6b3a, moveCost: 2, defense: 10 },
  road: { label: 'Droga', color: 0x9a8f7a, moveCost: 0.5, defense: 0 },
  city: { label: 'Miasto', color: 0x7a6a86, moveCost: 1, defense: 40 },
};

export const TERRAIN_IDS: readonly TerrainId[] = [
  'plain',
  'forest',
  'water',
  'mountain',
  'swamp',
  'road',
  'city',
];

export function pickVariantIndex(
  variantCount: number,
  random: () => number = Math.random,
): number {
  if (variantCount <= 0) {
    return 0;
  }

  return Math.min(variantCount - 1, Math.floor(random() * variantCount));
}
