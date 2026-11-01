export type TerrainId = 'plain' | 'forest' | 'water' | 'mountain' | 'swamp' | 'road' | 'city';

export interface TerrainDef {
  readonly label: string;
  readonly color: number;
  readonly moveCost: number;
  readonly defense: number;
}
