import { describe, expect, it } from 'vitest';
import {
  clearMap,
  createMap,
  fillMap,
  mapBounds,
  mapDoubledBounds,
  removeTerrain,
  setTerrain,
  terrainAt,
} from './model';

describe('createMap', () => {
  it('wypełnia prostokąt terenem bazowym', () => {
    const map = createMap(4, 3);

    expect(Object.keys(map.cells)).toHaveLength(12);
    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
    expect(terrainAt(map, { col: 3, row: 2 })).toBe('plain');
  });
});

describe('setTerrain', () => {
  it('zmienia teren w jednym heksie', () => {
    const map = createMap(4, 3);
    const painted = setTerrain(map, { col: 2, row: 1 }, 'forest');

    expect(terrainAt(painted, { col: 2, row: 1 })).toBe('forest');
    expect(terrainAt(painted, { col: 1, row: 1 })).toBe('plain');
  });

  it('dodaje kafelek poza mapą', () => {
    const map = createMap(4, 3);
    const painted = setTerrain(map, { col: 9, row: -2 }, 'city');

    expect(terrainAt(painted, { col: 9, row: -2 })).toBe('city');
    expect(mapBounds(painted)?.maxCol).toBe(9);
    expect(mapBounds(painted)?.minRow).toBe(-2);
  });

  it('nie mutuje poprzedniej mapy', () => {
    const map = createMap(4, 3);
    setTerrain(map, { col: 0, row: 0 }, 'city');

    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
  });
});

describe('removeTerrain', () => {
  it('zostawia pusty kafel', () => {
    const map = removeTerrain(createMap(4, 3), { col: 1, row: 1 });

    expect(terrainAt(map, { col: 1, row: 1 })).toBeUndefined();
    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
  });

  it('nie tworzy nowej mapy, gdy kafelka nie ma', () => {
    const map = createMap(4, 3);

    expect(removeTerrain(map, { col: 9, row: 9 })).toBe(map);
  });
});

describe('fillMap', () => {
  it('zalewa wszystkie kafelki jednym terenem', () => {
    const map = setTerrain(createMap(3, 2), { col: 0, row: 0 }, 'city');
    const filled = fillMap(map, 'water');

    expect(terrainAt(filled, { col: 0, row: 0 })).toBe('water');
    expect(terrainAt(filled, { col: 2, row: 1 })).toBe('water');
  });
});

describe('mapBounds', () => {
  it('liczy zasięg kafelków', () => {
    const map = setTerrain(createMap(2, 2), { col: 5, row: 7 }, 'road');
    const bounds = mapBounds(map);

    expect(bounds?.minCol).toBe(0);
    expect(bounds?.minRow).toBe(0);
    expect(bounds?.maxCol).toBe(5);
    expect(bounds?.maxRow).toBe(7);
  });

  it('zwraca undefined dla pustej mapy', () => {
    expect(mapBounds({ cells: {} })).toBeUndefined();
  });
});

describe('mapDoubledBounds', () => {
  it('liczy zasięg w kolumnach podwojonych', () => {
    const bounds = mapDoubledBounds(createMap(2, 2));

    expect(bounds?.minCol).toBe(0);
    expect(bounds?.maxCol).toBe(3);
    expect(bounds?.minRow).toBe(0);
    expect(bounds?.maxRow).toBe(1);
  });

  it('obejmuje kafelek dodany poza mapą', () => {
    const map = setTerrain(createMap(2, 2), { col: -1, row: -1 }, 'road');
    const bounds = mapDoubledBounds(map);

    expect(bounds?.minCol).toBe(-1);
    expect(bounds?.minRow).toBe(-1);
  });

  it('zwraca undefined dla pustej mapy', () => {
    expect(mapDoubledBounds({ cells: {} })).toBeUndefined();
  });
});

describe('clearMap', () => {
  it('usuwa wszystkie kafelki', () => {
    const map = clearMap();

    expect(Object.keys(map.cells)).toHaveLength(0);
    expect(mapBounds(map)).toBeUndefined();
  });
});
