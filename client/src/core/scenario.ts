import { generateMap, paintRect, type GameMap } from './map';
import {
  createInitialState,
  deployUnits,
  type GameState,
  type UnitDeployment,
} from './state';

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
