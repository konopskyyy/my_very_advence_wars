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
  return deployUnits(createInitialState(buildMap()), 'red', OPPONENT_DEPLOYMENT);
}

export const PIERWSZE_KROKI: CampaignTile = {
  id: 'pierwsze-kroki',
  title: 'To był zwykły spacer na grzyby',
  description: 'Zwiad na grzyby zamienia się w pierwszą bitwę. Kup zwiadowcę i wystaw trzech piechurów.',
  mission: {
    id: 'tutorial-pierwsze-kroki',
    name: 'To był zwykły spacer na grzyby',
    description:
      'Pusta mapa, 150 kredytów i jeden ukryty wróg. Najpierw zwiadowca, potem trzech piechurów.',
    state: buildState(),
    autoDeploy: false,
    spawn: { col: 2, row: 5, vision: 3 },
    recruitment: {
      funds: 150,
      allowedKinds: ['scout'],
      grants: [
        { after: 'scout', funds: 300, allowedKinds: ['infantry'], limits: { infantry: 3 } },
      ],
    },
    tutorial: {
      steps: [
        {
          hint: {
            title: 'REKRUTACJA',
            text: 'Jednostki kupujesz na dolnym pasku, przyciskiem KUP. Na start masz 150 kredytów i możesz kupić tylko zwiadowcę.',
          },
          until: { purchased: 'scout' },
        },
        {
          hint: {
            title: 'NAGRODA',
            text: 'Zwiadowca odsłonił mapę — czerwony piechur jest widoczny po drugiej stronie. W nagrodę masz 300 kredytów — kup za nie trzech piechurów.',
          },
          until: { purchased: 'infantry', count: 3 },
        },
        {
          hint: {
            title: 'PLANER',
            text: 'Zaplanuj ruch: kliknij własną jednostkę, potem heks. Drugi klik na tym samym heksie zatwierdza trasę. Plan zobaczysz w panelu planera — jeśli jest zwinięty, rozwiń go przyciskiem PLANUJ. Całą turę uruchamia WYKONAJ TURĘ.',
          },
          until: { moves: 1 },
        },
        {
          hint: {
            title: 'ATAK',
            text: 'Aby zaatakować, wybierz jednostkę i kliknij wroga w zasięgu, potem kliknij go ponownie, aby potwierdzić. Atak trafi do planu w panelu planera — rozwiń go przyciskiem PLANUJ, jeśli jest zwinięty. Po ataku możesz jeszcze zaplanować ruch; obie akcje wykonają się po WYKONAJ TURĘ.',
          },
          until: { attacks: 1 },
        },
      ],
    },
    withFogOfWar: (state) => ({ ...state, map: setFogOfWar(state.map, true) }),
  },
};
