import type { HexCoord } from './hex';
import type { TerrainId } from './terrain';

export interface GameMap {
  readonly cells: Readonly<Record<string, TerrainId>>;
}

export interface MapBounds {
  readonly minCol: number;
  readonly minRow: number;
  readonly maxCol: number;
  readonly maxRow: number;
}

export function cellKey(coord: HexCoord): string {
  return `${coord.col},${coord.row}`;
}

export function cellCoord(key: string): HexCoord {
  const [col, row] = key.split(',').map(Number);

  return { col: col ?? 0, row: row ?? 0 };
}

export function createMap(cols: number, rows: number, fill: TerrainId = 'plain'): GameMap {
  const cells: Record<string, TerrainId> = {};

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells[cellKey({ col, row })] = fill;
    }
  }

  return { cells };
}

export function terrainAt(map: GameMap, coord: HexCoord): TerrainId | undefined {
  return map.cells[cellKey(coord)];
}

export function setTerrain(map: GameMap, coord: HexCoord, terrain: TerrainId): GameMap {
  const key = cellKey(coord);

  if (map.cells[key] === terrain) {
    return map;
  }

  return { cells: { ...map.cells, [key]: terrain } };
}

export function removeTerrain(map: GameMap, coord: HexCoord): GameMap {
  const key = cellKey(coord);

  if (map.cells[key] === undefined) {
    return map;
  }

  const cells = { ...map.cells };
  delete cells[key];

  return { cells };
}

export function fillMap(map: GameMap, terrain: TerrainId): GameMap {
  const cells: Record<string, TerrainId> = {};

  for (const key of Object.keys(map.cells)) {
    cells[key] = terrain;
  }

  return { cells };
}

export function clearMap(): GameMap {
  return { cells: {} };
}

export function mapBounds(map: GameMap): MapBounds | undefined {
  let minCol = Infinity;
  let minRow = Infinity;
  let maxCol = -Infinity;
  let maxRow = -Infinity;

  for (const key of Object.keys(map.cells)) {
    const coord = cellCoord(key);

    minCol = Math.min(minCol, coord.col);
    minRow = Math.min(minRow, coord.row);
    maxCol = Math.max(maxCol, coord.col);
    maxRow = Math.max(maxRow, coord.row);
  }

  if (minCol === Infinity) {
    return undefined;
  }

  return { minCol, minRow, maxCol, maxRow };
}
