import { describe, expect, it } from 'vitest';
import { cellKey, createMap } from '../../src/core/map';
import { createInitialState, placeUnit } from '../../src/core/state';
import {
  isUnitVisible,
  visibleTileKeys,
  visibleUnitAt,
  visibleUnits,
} from '../../src/core/vision';

describe('widoczność jednostek przy mgle wojny', () => {
  it('bez mgły wszystkie jednostki są widoczne dla dowolnej strony', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 9, row: 9 }, 'red');

    expect(isUnitVisible(state, state.units[1]!, 'blue')).toBe(true);
    expect(visibleUnits(state, 'blue')).toHaveLength(2);
  });

  it('własne jednostki są zawsze widoczne', () => {
    let state = createInitialState(createMap(10, 10));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');

    expect(isUnitVisible(state, state.units[0]!, 'blue')).toBe(true);
  });

  it('ukrywa przeciwnika poza zasięgiem wzroku', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 5, row: 0 }, 'red');

    expect(isUnitVisible(state, state.units[1]!, 'blue')).toBe(false);
    expect(visibleUnits(state, 'blue')).toHaveLength(1);
  });

  it('zwiadowca widzi przeciwnika na drugim końcu mapy', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 19, row: 19 }, 'red');

    expect(isUnitVisible(state, state.units[1]!, 'blue')).toBe(true);
  });

  it('zwiadowca odsłania wszystkie kafle mapy', () => {
    let state = createInitialState(createMap(8, 6));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');

    expect(visibleTileKeys(state, 'blue').size).toBe(48);
  });

  it('artyleria widzi przeciwnika na drugim końcu mapy', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'artillery', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 19, row: 19 }, 'red');

    expect(isUnitVisible(state, state.units[1]!, 'blue')).toBe(true);
  });

  it('łączy zasięg wzroku wielu jednostek', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 10, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 12, row: 0 }, 'red');

    expect(isUnitVisible(state, state.units[2]!, 'blue')).toBe(true);
  });

  it('łączy kafle wzroku wszystkich jednostek strony i dołącza ich pozycje', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 10, row: 0 }, 'blue');
    state = placeUnit(state, 'scout', { col: 5, row: 5 }, 'red');

    const keys = visibleTileKeys(state, 'blue');

    expect(keys.has(cellKey({ col: 0, row: 0 }))).toBe(true);
    expect(keys.has(cellKey({ col: 10, row: 0 }))).toBe(true);
    expect(keys.has(cellKey({ col: 1, row: 0 }))).toBe(true);
    expect(keys.has(cellKey({ col: 9, row: 0 }))).toBe(true);
    expect(keys.has(cellKey({ col: 5, row: 5 }))).toBe(false);
  });

  it('artyleria odsłania wszystkie kafle mapy', () => {
    let state = createInitialState(createMap(8, 6));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'artillery', { col: 0, row: 0 }, 'blue');

    expect(visibleTileKeys(state, 'blue').size).toBe(48);
  });

  it('znajduje widoczną jednostkę na heksie', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 3, row: 0 }, 'red');

    expect(visibleUnitAt(state, { col: 3, row: 0 }, 'blue')?.kind).toBe('tank');
    expect(visibleUnitAt(state, { col: 3, row: 0 }, 'red')?.kind).toBe('tank');
  });
});

describe('wzrok punktu startowego', () => {
  const sight = { pos: { col: 2, row: 5 }, range: 3 };

  it('odsłania wroga w zasięgu bazy bez własnych jednostek', () => {
    let state = createInitialState(createMap(16, 10));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 4, row: 5 }, 'red');

    expect(isUnitVisible(state, state.units[0]!, 'blue', sight)).toBe(true);
    expect(visibleUnits(state, 'blue', sight)).toHaveLength(1);
    expect(visibleUnitAt(state, { col: 4, row: 5 }, 'blue', sight)).toBeDefined();
  });

  it('ukrywa wroga poza zasięgiem bazy', () => {
    let state = createInitialState(createMap(16, 10));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'infantry', { col: 13, row: 5 }, 'red');

    expect(isUnitVisible(state, state.units[0]!, 'blue', sight)).toBe(false);
    expect(visibleUnits(state, 'blue', sight)).toHaveLength(0);
  });

  it('dołącza heks bazy i kafle w promieniu wzroku', () => {
    const state = {
      ...createInitialState(createMap(16, 10)),
      map: { ...createMap(16, 10), fogOfWar: true },
    };
    const keys = visibleTileKeys(state, 'blue', sight);

    expect(keys.has(cellKey(sight.pos))).toBe(true);
    expect(keys.has(cellKey({ col: 2, row: 8 }))).toBe(true);
    expect(keys.has(cellKey({ col: 2, row: 9 }))).toBe(false);
  });
});
