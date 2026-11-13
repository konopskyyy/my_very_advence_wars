import { generateMap, paintRect, setFogOfWar, type GameMap } from '../../map';
import { createInitialState, deployUnits, type GameState } from '../../state';
import type { CampaignTile } from '../types';

const MAP_COLS = 16;
const MAP_ROWS = 10;

const PLAYER_DEPLOYMENT = [
  { kind: 'infantry', col: 3, row: 4 },
  { kind: 'infantry', col: 3, row: 6 },
  { kind: 'scout', col: 2, row: 6 },
] as const;

const OPPONENT_DEPLOYMENT = [{ kind: 'infantry', col: 13, row: 5 }] as const;

function buildMap(): GameMap {
  let map = generateMap({ cols: MAP_COLS, rows: MAP_ROWS, fill: 'plain' });

  map = paintRect(map, 5, 1, 2, 2, 'forest');
  map = paintRect(map, 7, 7, 3, 2, 'forest');
  map = paintRect(map, 10, 2, 2, 2, 'swamp');
  map = paintRect(map, 11, 0, 1, 3, 'water');
  map = paintRect(map, 0, 5, MAP_COLS, 1, 'road');
  map = paintRect(map, 14, 4, 1, 1, 'city');

  return setFogOfWar(map, true);
}

function buildState(): GameState {
  const initial = createInitialState(buildMap());

  return deployUnits(deployUnits(initial, 'blue', PLAYER_DEPLOYMENT), 'red', OPPONENT_DEPLOYMENT);
}

export const RUCH_JEDNOSTEK: CampaignTile = {
  id: 'ruch-jednostek',
  title: 'Ruch jednostek',
  description: 'Punkty ruchu, koszt terenu i wyznaczanie trasy.',
  mission: {
    id: 'tutorial-ruch-jednostek',
    name: 'Ruch jednostek',
    description:
      'Trasa przez las, bagno i drogę. Naucz się planować ruch, zanim wróg podejdzie.',
    state: buildState(),
    autoDeploy: false,
    spawn: { col: 2, row: 5, vision: 3 },
    recruitment: { funds: 0, allowedKinds: [] },
    tutorial: {
      steps: [
        {
          hint: {
            title: 'PUNKTY RUCHU',
            text: 'Każda jednostka ma limit ruchu: piechur 4 punkty, zwiadowca 6. Kliknij własną jednostkę, a potem heks w zasięgu, żeby zaplanować trasę.',
          },
          until: { moves: 1 },
        },
        {
          hint: {
            title: 'KOSZT TERENU',
            text: 'Droga kosztuje 0,5 punktu ruchu, las i bagno po 2, góra 3. Podgląd trasy przed zatwierdzeniem pokazuje jej koszt i pozostałe punkty.',
          },
          until: { moves: 2 },
        },
        {
          hint: {
            title: 'ZATWIERDŹ RUCH',
            text: 'Drugi klik na tym samym heksie zatwierdza trasę. Zaplanowane ruchy są na osi czasu — całą turę uruchamia WYKONAJ TURĘ.',
          },
          until: { moves: 3 },
        },
        {
          hint: {
            title: 'CEL',
            text: 'Czerwony piechur stoi po drugiej stronie mapy. Dotrzyj do niego i zaatakuj — wróg ruszy się po Twojej turze.',
          },
          until: { attacks: 1 },
        },
      ],
    },
  },
};
