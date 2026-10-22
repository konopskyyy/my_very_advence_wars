import { cellKey, createMap, mapBounds, type GameMap } from './model';
import type { TerrainId } from '../terrain';

export const MAP_COLS = 22;
export const MAP_ROWS = 14;

export type MapEdge = 'top' | 'bottom' | 'left' | 'right';

export const MAP_EDGES: readonly MapEdge[] = ['top', 'bottom', 'left', 'right'];

export interface GenerateOptions {
  readonly cols?: number;
  readonly rows?: number;
  readonly fill?: TerrainId;
  readonly edges?: Partial<Record<MapEdge, number>>;
  readonly edgeTerrain?: TerrainId;
}

export function generateMap(options: GenerateOptions = {}): GameMap {
  const cols = options.cols ?? MAP_COLS;
  const rows = options.rows ?? MAP_ROWS;
  const fill = options.fill ?? 'plain';
  const edges = options.edges ?? {};
  const edgeTerrain = options.edgeTerrain ?? fill;

  let map = createMap(cols, rows, fill);

  for (const edge of MAP_EDGES) {
    const amount = edges[edge] ?? 0;

    if (amount > 0) {
      map = extendMap(map, edge, amount, edgeTerrain);
    }
  }

  return map;
}

export function extendMap(
  map: GameMap,
  edge: MapEdge,
  amount: number,
  terrain: TerrainId,
): GameMap {
  const bounds = mapBounds(map);

  if (!bounds || amount <= 0) {
    return map;
  }

  const cells = { ...map.cells };

  for (let step = 1; step <= amount; step += 1) {
    if (edge === 'top') {
      fillRow(cells, bounds.minRow - step, bounds.minCol, bounds.maxCol, terrain);
    }

    if (edge === 'bottom') {
      fillRow(cells, bounds.maxRow + step, bounds.minCol, bounds.maxCol, terrain);
    }

    if (edge === 'left') {
      fillColumn(cells, bounds.minCol - step, bounds.minRow, bounds.maxRow, terrain);
    }

    if (edge === 'right') {
      fillColumn(cells, bounds.maxCol + step, bounds.minRow, bounds.maxRow, terrain);
    }
  }

  return { cells };
}

export function paintRect(
  map: GameMap,
  col: number,
  row: number,
  cols: number,
  rows: number,
  terrain: TerrainId,
): GameMap {
  const cells = { ...map.cells };

  for (let r = row; r < row + rows; r += 1) {
    fillRow(cells, r, col, col + cols - 1, terrain);
  }

  return { cells };
}

function fillRow(
  cells: Record<string, TerrainId>,
  row: number,
  minCol: number,
  maxCol: number,
  terrain: TerrainId,
): void {
  for (let col = minCol; col <= maxCol; col += 1) {
    cells[cellKey({ col, row })] = terrain;
  }
}

function fillColumn(
  cells: Record<string, TerrainId>,
  col: number,
  minRow: number,
  maxRow: number,
  terrain: TerrainId,
): void {
  for (let row = minRow; row <= maxRow; row += 1) {
    cells[cellKey({ col, row })] = terrain;
  }
}
