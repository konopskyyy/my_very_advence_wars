import { describe, expect, it } from 'vitest';
import { BUILT_IN_MAPS, findMapDefinition } from '../../../src/core/map/catalog';
import { mapBounds, mapTileCount, terrainAt } from '../../../src/core/map/model';

function mapOf(id: string) {
  const definition = findMapDefinition(id);

  expect(definition).toBeDefined();

  return definition!.map;
}

describe('wbudowane mapy', () => {
  it('mają identyfikatory, nazwy i opisy', () => {
    expect(BUILT_IN_MAPS.map(({ id }) => id)).toEqual(['dolina', 'wzgorza']);
    expect(BUILT_IN_MAPS.map(({ name }) => name)).toEqual(['Dolina', 'Wzgórza']);
    expect(BUILT_IN_MAPS.map(({ description }) => description)).toEqual([
      'Rzeka przez łąki, lasy i jedno miasto.',
      'Grzbiet gór, jezioro i droga przez bagno.',
    ]);
  });

  it('Dolina ma rzekę na skraju mapy', () => {
    const map = mapOf('dolina');

    expect(mapBounds(map)).toEqual({ minCol: 0, minRow: -1, maxCol: 21, maxRow: 14 });
    expect(mapTileCount(map)).toBe(352);

    expect(terrainAt(map, { col: 0, row: -1 })).toBe('mountain');
    expect(terrainAt(map, { col: 21, row: 14 })).toBe('forest');
    expect(terrainAt(map, { col: 8, row: -1 })).toBe('water');
    expect(terrainAt(map, { col: 9, row: 14 })).toBe('water');
    expect(terrainAt(map, { col: 2, row: 3 })).toBe('forest');
    expect(terrainAt(map, { col: 5, row: 6 })).toBe('forest');
    expect(terrainAt(map, { col: 6, row: 3 })).toBe('plain');
    expect(terrainAt(map, { col: 0, row: 9 })).toBe('road');
    expect(terrainAt(map, { col: 21, row: 9 })).toBe('road');
    expect(terrainAt(map, { col: 8, row: 9 })).toBe('road');
    expect(terrainAt(map, { col: 17, row: 2 })).toBe('swamp');
    expect(terrainAt(map, { col: 19, row: 4 })).toBe('swamp');
    expect(terrainAt(map, { col: 20, row: 2 })).toBe('plain');
    expect(terrainAt(map, { col: 14, row: 5 })).toBe('city');
    expect(terrainAt(map, { col: 15, row: 5 })).toBe('plain');
  });

  it('Wzgórza mają góry po prawej i bagno na dole', () => {
    const map = mapOf('wzgorza');

    expect(mapBounds(map)).toEqual({ minCol: 0, minRow: 0, maxCol: 21, maxRow: 12 });
    expect(mapTileCount(map)).toBe(286);

    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
    expect(terrainAt(map, { col: 20, row: 0 })).toBe('mountain');
    expect(terrainAt(map, { col: 21, row: 11 })).toBe('mountain');
    expect(terrainAt(map, { col: 0, row: 12 })).toBe('swamp');
    expect(terrainAt(map, { col: 21, row: 12 })).toBe('swamp');
    expect(terrainAt(map, { col: 3, row: 2 })).toBe('mountain');
    expect(terrainAt(map, { col: 5, row: 3 })).toBe('mountain');
    expect(terrainAt(map, { col: 6, row: 2 })).toBe('plain');
    expect(terrainAt(map, { col: 7, row: 4 })).toBe('mountain');
    expect(terrainAt(map, { col: 13, row: 7 })).toBe('mountain');
    expect(terrainAt(map, { col: 15, row: 2 })).toBe('forest');
    expect(terrainAt(map, { col: 16, row: 4 })).toBe('forest');
    expect(terrainAt(map, { col: 17, row: 2 })).toBe('plain');
    expect(terrainAt(map, { col: 4, row: 8 })).toBe('water');
    expect(terrainAt(map, { col: 7, row: 9 })).toBe('water');
    expect(terrainAt(map, { col: 8, row: 8 })).toBe('plain');
    expect(terrainAt(map, { col: 9, row: 0 })).toBe('road');
    expect(terrainAt(map, { col: 9, row: 11 })).toBe('road');
    expect(terrainAt(map, { col: 9, row: 5 })).toBe('city');
  });
});

describe('findMapDefinition', () => {
  it('zwraca mapę po identyfikatorze', () => {
    expect(findMapDefinition('dolina')).toBe(BUILT_IN_MAPS[0]);
    expect(findMapDefinition('wzgorza')).toBe(BUILT_IN_MAPS[1]);
  });

  it('zwraca undefined dla nieznanej mapy', () => {
    expect(findMapDefinition('nie-ma-takiej')).toBeUndefined();
  });
});
