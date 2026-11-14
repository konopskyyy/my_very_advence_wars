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

function buildMap(): GameMap {
  let map = generateMap({ cols: MAP_COLS, rows: MAP_ROWS, fill: 'plain' });

  map = paintRect(map, 0, 5, MAP_COLS, 1, 'road');
  map = paintRect(map, 4, 1, 3, 2, 'forest');
  map = paintRect(map, 5, 3, 2, 2, 'city');
  map = paintRect(map, 5, 6, 2, 2, 'mountain');
  map = paintRect(map, 8, 2, 2, 2, 'swamp');
  map = paintRect(map, 8, 6, 3, 2, 'forest');
  map = paintRect(map, 11, 3, 1, 5, 'mountain');
  map = paintRect(map, 12, 0, 1, 3, 'water');
  map = paintRect(map, 12, 6, 1, 4, 'swamp');
  map = paintRect(map, 13, 3, 2, 2, 'city');

  return setFogOfWar(map, true);
}

function buildState(): GameState {
  return deployUnits(createInitialState(buildMap()), 'blue', PLAYER_DEPLOYMENT);
}

export const RUCH_JEDNOSTEK: CampaignTile = {
  id: 'ruch-jednostek',
  title: 'Ruch jednostek',
  description: 'Punkty ruchu, koszt terenu i wyznaczanie trasy.',
  requiresMission: 'tutorial-pierwsze-kroki',
  mission: {
    id: 'tutorial-ruch-jednostek',
    name: 'Ruch jednostek',
    description:
      'Poligon bez wroga: góry, bagno i miasto pokazują, ile ruchu kosztuje teren.',
    state: buildState(),
    autoDeploy: false,
    sandbox: true,
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
            text: 'Droga kosztuje 0,5 punktu ruchu, miasto 1, bagno 2, a góry 3. Podgląd trasy przed zatwierdzeniem pokazuje jej koszt i pozostałe punkty.',
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
            title: 'MIASTO I NAGRODA',
            text: 'Miasto kosztuje tylko 1 punkt ruchu. Dojdź do miasta albo wykonaj czwarty ruch, żeby odebrać 300 kredytów na czołg.',
          },
          until: { moves: 4 },
          reward: { funds: 300, allowedKinds: ['tank'] },
        },
        {
          hint: {
            title: 'CZOŁG',
            text: 'KUP jest odblokowany. Otwórz KUP i postaw czołg obok bazy — to kończy lekcję ruchu.',
          },
          until: { purchased: 'tank', count: 1 },
        },
      ],
    },
  },
};
