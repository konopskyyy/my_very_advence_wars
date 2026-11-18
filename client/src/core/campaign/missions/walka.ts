import { generateMap, paintRect, setFogOfWar, type GameMap } from '../../map';
import { createInitialState, deployUnits, type GameState } from '../../state';
import type { CampaignTile } from '../types';

const MAP_COLS = 16;
const MAP_ROWS = 10;

const PLAYER_DEPLOYMENT = [
  { kind: 'tank', col: 3, row: 5 },
  { kind: 'infantry', col: 2, row: 4 },
  { kind: 'infantry', col: 2, row: 6 },
  { kind: 'scout', col: 3, row: 4 },
] as const;

const ENEMY_DEPLOYMENT = [{ kind: 'infantry', col: 6, row: 5 }] as const;

function buildMap(): GameMap {
  let map = generateMap({ cols: MAP_COLS, rows: MAP_ROWS, fill: 'plain' });

  map = paintRect(map, 4, 2, 2, 2, 'forest');
  map = paintRect(map, 7, 1, 1, 3, 'forest');
  map = paintRect(map, 10, 6, 2, 2, 'forest');
  map = paintRect(map, 5, 7, 2, 1, 'city');
  map = paintRect(map, 8, 3, 2, 1, 'city');
  map = paintRect(map, 12, 2, 2, 2, 'city');

  return setFogOfWar(map, false);
}

function buildState(): GameState {
  const state = deployUnits(createInitialState(buildMap()), 'blue', PLAYER_DEPLOYMENT);

  return deployUnits(state, 'red', ENEMY_DEPLOYMENT);
}

export const WALKA: CampaignTile = {
  id: 'walka',
  title: 'Walka',
  description: 'Atak, obrażenia i jeden wolumen strzałów.',
  requiresMission: 'tutorial-ruch-jednostek',
  mission: {
    id: 'tutorial-walka',
    name: 'Grzyby strzelają',
    description:
      'Poligon walki: trzy cele, wspólny wolumen ataków i jednorazowy nalot z zasięgiem na całą mapę.',
    state: buildState(),
    autoDeploy: false,
    sandbox: true,
    spawn: { col: 2, row: 5, vision: 3 },
    recruitment: { funds: 0, allowedKinds: [] },
    tutorial: {
      steps: [
        {
          hint: {
            title: 'PIERWSZY STRZAŁ',
            text: 'Wybierz jednostkę i kliknij czerwonego piechura na (6, 5) prawym przyciskiem — pojawi się podgląd strzału. Kliknij go lewym, aby zatwierdzić atak. Piechur ma 10 HP, więc potrzebne są dwa trafienia po 5 obrażeń. Wykonań turę, żeby strzał doszedł do celu.',
          },
          until: { attacks: 1 },
        },
        {
          hint: {
            title: 'DOCISNIJ CEL',
            text: 'Jeszcze jeden atak zabije pierwszego piechura. Po wykonanej turze pojawią się dwaj nowi czerwoni piechurzy na (9, 4) i (9, 6). Zaplanuj ataki dla kilku jednostek naraz — każda z nich ma własny tor na osi czasu.',
          },
          until: { attacks: 2 },
          spawn: [
            { kind: 'infantry', faction: 'red', col: 9, row: 4 },
            { kind: 'infantry', faction: 'red', col: 9, row: 6 },
          ],
        },
        {
          hint: {
            title: 'JEDEN WOLUMEN',
            text: 'Zaplanuj cztery ataki i wykonaj turę. Wszystkie strzały rozstrzygają się w jednym wolumenie z tego samego stanu: kilka trafień w ten sam cel sumuje się, a kolejność nie zmienia wyniku. Nagroda to 250 kredytów i dostęp do bombowca.',
          },
          until: { attacks: 4 },
          spawn: [{ kind: 'tank', faction: 'red', col: 12, row: 5 }],
          reward: { funds: 250, allowedKinds: ['bomber'] },
        },
        {
          hint: {
            title: 'NALOT',
            text: 'Kup bombowca w oknie KUP, a potem użyj przycisku NALOT na pasku dowodzenia. Bombowiec widzi i ostrzeliwuje całą mapę jednym strzałem, który zadaje 25 obrażeń i wyczerpuje jego ruch. Zakończ lekcję dziewiątym atakiem.',
          },
          until: { purchased: 'bomber', attacks: 9 },
        },
      ],
    },
  },
};
