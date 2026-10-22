import { describe, expect, it } from 'vitest';
import { cellCoord, mapBounds, terrainAt } from './model';
import { extendMap, generateMap, paintRect } from './generator';
import { hexToPixel } from './layout';

describe('generateMap', () => {
  it('tworzy prostokąt 22×14 z terenem bazowym', () => {
    const map = generateMap();

    expect(Object.keys(map.cells)).toHaveLength(22 * 14);
    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
    expect(terrainAt(map, { col: 21, row: 13 })).toBe('plain');
  });

  it('dodaje kafelki na krawędziach', () => {
    const map = generateMap({ edges: { top: 1, left: 2 } });

    const bounds = mapBounds(map);

    expect(bounds?.minRow).toBe(-1);
    expect(bounds?.minCol).toBe(-2);
    expect(bounds?.maxRow).toBe(13);
    expect(bounds?.maxCol).toBe(21);
  });

  it('nie przesuwa istniejących kafelków przy rozszerzeniu', () => {
    const base = generateMap({ cols: 4, rows: 3 });
    const extended = generateMap({ cols: 4, rows: 3, edges: { top: 2 } });

    expect(terrainAt(extended, { col: 0, row: 0 })).toBe(terrainAt(base, { col: 0, row: 0 }));
    expect(terrainAt(extended, { col: 3, row: 2 })).toBe(terrainAt(base, { col: 3, row: 2 }));
  });
});

describe('extendMap', () => {
  it('dokłada wiersz na górnej krawędzi', () => {
    const map = extendMap(generateMap({ cols: 3, rows: 2 }), 'top', 1, 'forest');

    expect(terrainAt(map, { col: 0, row: -1 })).toBe('forest');
    expect(terrainAt(map, { col: 2, row: -1 })).toBe('forest');
    expect(terrainAt(map, { col: 0, row: 0 })).toBe('plain');
  });

  it('dokłada kolumnę na prawej krawędzi', () => {
    const map = extendMap(generateMap({ cols: 3, rows: 2 }), 'right', 1, 'water');

    expect(terrainAt(map, { col: 3, row: 0 })).toBe('water');
    expect(terrainAt(map, { col: 3, row: 1 })).toBe('water');
    expect(mapBounds(map)?.maxCol).toBe(3);
  });

  it('dokłada kilka wierszy naraz', () => {
    const map = extendMap(generateMap({ cols: 2, rows: 2 }), 'bottom', 3, 'mountain');

    expect(terrainAt(map, { col: 0, row: 4 })).toBe('mountain');
    expect(mapBounds(map)?.maxRow).toBe(4);
  });

  it('nie mutuje poprzedniej mapy', () => {
    const map = generateMap({ cols: 2, rows: 2 });
    extendMap(map, 'left', 1, 'city');

    expect(terrainAt(map, { col: -1, row: 0 })).toBeUndefined();
  });

  it('nie przesuwa istniejących heksów', () => {
    const size = 22;
    const map = generateMap({ cols: 4, rows: 3 });
    const before = Object.keys(map.cells).map((key) => ({
      key,
      pixel: hexToPixel(cellCoord(key), size),
    }));

    const extended = extendMap(map, 'top', 2, 'forest');

    for (const entry of before) {
      expect(extended.cells[entry.key]).toBe(map.cells[entry.key]);
      expect(hexToPixel(cellCoord(entry.key), size)).toEqual(entry.pixel);
    }
  });

  it('nie zmienia pustej mapy', () => {
    const empty = { cells: {} };

    expect(extendMap(empty, 'top', 3, 'city')).toBe(empty);
  });
});

describe('paintRect', () => {
  it('wypełnia prostokąt terenem', () => {
    const map = paintRect(generateMap({ cols: 4, rows: 4 }), 1, 1, 2, 2, 'water');

    expect(terrainAt(map, { col: 1, row: 1 })).toBe('water');
    expect(terrainAt(map, { col: 2, row: 2 })).toBe('water');
    expect(terrainAt(map, { col: 3, row: 2 })).toBe('plain');
  });

  it('maluje poza prostokątem mapy', () => {
    const map = paintRect(generateMap({ cols: 2, rows: 2 }), -1, -1, 4, 4, 'city');

    expect(terrainAt(map, { col: -1, row: -1 })).toBe('city');
    expect(mapBounds(map)?.minCol).toBe(-1);
  });
});
