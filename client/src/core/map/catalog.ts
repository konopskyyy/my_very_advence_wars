import { extendMap, generateMap, paintRect } from './generator';
import type { GameMap } from './model';

export interface MapDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly map: GameMap;
}

function dolina(): GameMap {
  let map = generateMap({ cols: 22, rows: 14, fill: 'plain' });

  map = extendMap(map, 'top', 1, 'mountain');
  map = extendMap(map, 'bottom', 1, 'forest');
  map = paintRect(map, 8, -1, 2, 16, 'water');
  map = paintRect(map, 2, 3, 4, 4, 'forest');
  map = paintRect(map, 0, 9, 22, 1, 'road');
  map = paintRect(map, 17, 2, 3, 3, 'swamp');
  map = paintRect(map, 14, 5, 1, 1, 'city');

  return map;
}

function wzgorza(): GameMap {
  let map = generateMap({ cols: 20, rows: 12, fill: 'plain' });

  map = extendMap(map, 'right', 2, 'mountain');
  map = extendMap(map, 'bottom', 1, 'swamp');
  map = paintRect(map, 3, 2, 3, 2, 'mountain');
  map = paintRect(map, 7, 4, 3, 2, 'mountain');
  map = paintRect(map, 11, 6, 3, 2, 'mountain');
  map = paintRect(map, 15, 2, 2, 3, 'forest');
  map = paintRect(map, 4, 8, 4, 2, 'water');
  map = paintRect(map, 9, 0, 1, 12, 'road');
  map = paintRect(map, 9, 5, 1, 1, 'city');

  return map;
}

export const BUILT_IN_MAPS: readonly MapDefinition[] = [
  {
    id: 'dolina',
    name: 'Dolina',
    description: 'Rzeka przez łąki, lasy i jedno miasto.',
    map: dolina(),
  },
  {
    id: 'wzgorza',
    name: 'Wzgórza',
    description: 'Grzbiet gór, jezioro i droga przez bagno.',
    map: wzgorza(),
  },
];

export function findMapDefinition(id: string): MapDefinition | undefined {
  return BUILT_IN_MAPS.find((definition) => definition.id === id);
}
