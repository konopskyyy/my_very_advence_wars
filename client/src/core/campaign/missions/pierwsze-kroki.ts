import {
  generateMap,
  paintRect,
  setFogOfWar,
  type GameMap,
} from '../../map';
import { createInitialState, deployUnits, type GameState } from '../../state';
import type { CampaignTile } from '../types';

const MAP_COLS = 16;
const MAP_ROWS = 10;

const PLAYER_DEPLOYMENT = [
  { kind: 'infantry', col: 1, row: 4 },
  { kind: 'infantry', col: 2, row: 6 },
  { kind: 'infantry', col: 3, row: 5 },
] as const;

const OPPONENT_DEPLOYMENT = [{ kind: 'infantry', col: 13, row: 5 }] as const;

function buildMap(): GameMap {
  let map = generateMap({ cols: MAP_COLS, rows: MAP_ROWS, fill: 'plain' });

  map = paintRect(map, 5, 2, 2, 2, 'forest');
  map = paintRect(map, 9, 6, 3, 2, 'forest');
  map = paintRect(map, 7, 0, 1, 4, 'water');
  map = paintRect(map, 0, 4, MAP_COLS, 1, 'road');
  map = paintRect(map, 14, 2, 1, 1, 'city');

  return setFogOfWar(map, true);
}

function buildState(): GameState {
  const state = createInitialState(buildMap());
  const withPlayer = deployUnits(state, 'blue', PLAYER_DEPLOYMENT);

  return deployUnits(withPlayer, 'red', OPPONENT_DEPLOYMENT);
}

export const PIERWSZE_KROKI: CampaignTile = {
  id: 'pierwsze-kroki',
  title: 'Pierwsze kroki',
  description: 'Trzech własnych piechurów i ukryty wróg za linią mgły.',
  mission: {
    id: 'tutorial-pierwsze-kroki',
    name: 'Pierwsze kroki',
    description:
      'Prosta mapa samouczka. Trzech niebieskich piechurów naprzeciw jednego czerwonego, ukrytego w mgle wojny.',
    state: buildState(),
    withFogOfWar: (state) => ({ ...state, map: setFogOfWar(state.map, true) }),
  },
};
