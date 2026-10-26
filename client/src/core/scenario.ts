import {
  cellKey,
  generateMap,
  mapBounds,
  paintRect,
  type GameMap,
  type HexCoord,
} from './map';
import {
  createInitialState,
  deployUnits,
  type GameState,
  type UnitDeployment,
} from './state';
import { IMPASSABLE, TERRAIN_DEFS } from './terrain';
import type { FactionId, UnitKind } from './units';

export interface ScenarioDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly state: GameState;
}

export const SCENARIO_COLS = 48;
export const SCENARIO_ROWS = 28;

const PLAYER_DEPLOYMENT: readonly UnitDeployment[] = [
  { kind: 'infantry', col: 4, row: 12 },
  { kind: 'infantry', col: 6, row: 15 },
  { kind: 'infantry', col: 10, row: 12 },
  { kind: 'infantry', col: 12, row: 15 },
  { kind: 'tank', col: 5, row: 13 },
  { kind: 'tank', col: 9, row: 17 },
  { kind: 'artillery', col: 7, row: 15 },
  { kind: 'artillery', col: 12, row: 13 },
  { kind: 'scout', col: 2, row: 11 },
  { kind: 'scout', col: 3, row: 24 },
];

const OPPONENT_DEPLOYMENT: readonly UnitDeployment[] = [
  { kind: 'infantry', col: 43, row: 12 },
  { kind: 'infantry', col: 40, row: 15 },
  { kind: 'infantry', col: 37, row: 13 },
  { kind: 'infantry', col: 44, row: 18 },
  { kind: 'tank', col: 42, row: 13 },
  { kind: 'tank', col: 39, row: 17 },
  { kind: 'artillery', col: 44, row: 15 },
  { kind: 'artillery', col: 36, row: 14 },
  { kind: 'scout', col: 46, row: 11 },
  { kind: 'scout', col: 39, row: 20 },
];

const AUTO_DEPLOYMENT: readonly UnitKind[] = [
  'infantry',
  'infantry',
  'infantry',
  'infantry',
  'tank',
  'tank',
  'artillery',
  'artillery',
  'scout',
  'scout',
];

const AUTO_FACTIONS: readonly FactionId[] = ['blue', 'red'];

export function ensureScenarioArmies(state: GameState): GameState {
  let next = state;

  for (const faction of AUTO_FACTIONS) {
    if (next.units.some((unit) => unit.faction === faction)) {
      continue;
    }

    const slots = deploymentSlots(next, faction);
    const deployment = slots.slice(0, AUTO_DEPLOYMENT.length).map((coord, index) => ({
      kind: AUTO_DEPLOYMENT[index]!,
      col: coord.col,
      row: coord.row,
    }));

    next = deployUnits(next, faction, deployment);
  }

  return next;
}

function deploymentSlots(state: GameState, faction: FactionId): HexCoord[] {
  const bounds = mapBounds(state.map);

  if (!bounds) {
    return [];
  }

  const columns = columnOrder(bounds.minCol, bounds.maxCol, faction);
  const occupied = new Set(state.units.map((unit) => cellKey(unit.pos)));
  const slots: HexCoord[] = [];

  for (const row of spreadRows(bounds.minRow, bounds.maxRow, AUTO_DEPLOYMENT.length)) {
    const coord = columns
      .map((col) => ({ col, row }))
      .find((candidate) => isFreeDeployment(state, occupied, candidate));

    if (coord) {
      slots.push(coord);
      occupied.add(cellKey(coord));
    }
  }

  for (const row of spreadRows(bounds.minRow, bounds.maxRow, bounds.maxRow - bounds.minRow + 1)) {
    for (const col of columns) {
      if (slots.length >= AUTO_DEPLOYMENT.length) {
        return slots;
      }

      const coord = { col, row };

      if (isFreeDeployment(state, occupied, coord)) {
        slots.push(coord);
        occupied.add(cellKey(coord));
      }
    }
  }

  return slots;
}

function spreadRows(minRow: number, maxRow: number, count: number): number[] {
  if (maxRow < minRow) {
    return [];
  }

  const rows: number[] = [];
  const span = maxRow - minRow;

  for (let index = 0; index < count; index += 1) {
    const row = count === 1 ? minRow : minRow + Math.round((index * span) / (count - 1));

    if (!rows.includes(row)) {
      rows.push(row);
    }
  }

  for (let row = minRow; row <= maxRow && rows.length < count; row += 1) {
    if (!rows.includes(row)) {
      rows.push(row);
    }
  }

  return rows;
}

function columnOrder(minCol: number, maxCol: number, faction: FactionId): number[] {
  const columns: number[] = [];

  if (faction === 'red') {
    for (let col = maxCol; col >= minCol; col -= 1) {
      columns.push(col);
    }
  } else {
    for (let col = minCol; col <= maxCol; col += 1) {
      columns.push(col);
    }
  }

  return columns;
}

function isFreeDeployment(
  state: GameState,
  occupied: ReadonlySet<string>,
  coord: HexCoord,
): boolean {
  const key = cellKey(coord);
  const terrain = state.map.cells[key];

  return (
    !occupied.has(key) &&
    terrain !== undefined &&
    TERRAIN_DEFS[terrain].moveCost < IMPASSABLE
  );
}

function buildFrontMap(): GameMap {
  let map = generateMap({ cols: SCENARIO_COLS, rows: SCENARIO_ROWS, fill: 'plain' });

  map = paintRect(map, 0, 0, 13, 3, 'mountain');
  map = paintRect(map, 3, 3, 8, 2, 'mountain');
  map = paintRect(map, 33, 0, 12, 2, 'mountain');
  map = paintRect(map, 36, 21, 12, 7, 'mountain');
  map = paintRect(map, 32, 24, 4, 4, 'mountain');

  map = paintRect(map, 1, 16, 9, 9, 'forest');
  map = paintRect(map, 11, 20, 6, 5, 'forest');
  map = paintRect(map, 35, 7, 10, 6, 'forest');
  map = paintRect(map, 14, 4, 5, 4, 'forest');
  map = paintRect(map, 27, 20, 4, 4, 'forest');

  map = paintRect(map, 22, 0, 2, 6, 'water');
  map = paintRect(map, 24, 6, 2, 6, 'water');
  map = paintRect(map, 22, 12, 2, 5, 'water');
  map = paintRect(map, 24, 17, 2, 6, 'water');
  map = paintRect(map, 22, 23, 2, 5, 'water');
  map = paintRect(map, 28, 2, 4, 3, 'water');
  map = paintRect(map, 10, 9, 5, 3, 'water');

  map = paintRect(map, 19, 8, 3, 6, 'swamp');
  map = paintRect(map, 26, 14, 3, 6, 'swamp');
  map = paintRect(map, 19, 18, 3, 4, 'swamp');
  map = paintRect(map, 15, 12, 4, 3, 'swamp');

  map = paintRect(map, 0, 13, SCENARIO_COLS, 2, 'road');
  map = paintRect(map, 8, 0, 2, SCENARIO_ROWS, 'road');
  map = paintRect(map, 17, 5, 2, 9, 'road');
  map = paintRect(map, 33, 13, 2, 14, 'road');

  map = paintRect(map, 5, 12, 2, 2, 'city');
  map = paintRect(map, 41, 12, 2, 2, 'city');
  map = paintRect(map, 15, 3, 2, 2, 'city');
  map = paintRect(map, 30, 22, 2, 2, 'city');
  map = paintRect(map, 33, 8, 2, 2, 'city');
  map = paintRect(map, 12, 22, 2, 2, 'city');

  return map;
}

function buildFrontState(): GameState {
  const state = createInitialState(buildFrontMap());
  const withPlayer = deployUnits(state, 'blue', PLAYER_DEPLOYMENT);

  return deployUnits(withPlayer, 'red', OPPONENT_DEPLOYMENT);
}

const FRONT_STATE = buildFrontState();

export const BUILT_IN_SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'front-wschodni',
    name: 'Front Wschodni',
    description:
      'Duża mapa testowa: rzeka, góry, bagna, lasy i drogi. Niebieska strona gracza naprzeciw czerwonej.',
    state: FRONT_STATE,
  },
];

export function findScenarioDefinition(id: string): ScenarioDefinition | undefined {
  return BUILT_IN_SCENARIOS.find((definition) => definition.id === id);
}
