import { describe, expect, it } from 'vitest';
import { createMap } from '../../src/core/map';
import { createInitialState, placeUnit } from '../../src/core/state';
import { isUnitVisible, visibleUnitAt, visibleUnits } from '../../src/core/vision';

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

  it('pokazuje przeciwnika w zasięgu wzroku zwiadu', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 5, row: 0 }, 'red');

    expect(isUnitVisible(state, state.units[1]!, 'blue')).toBe(true);
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

  it('znajduje widoczną jednostkę na heksie', () => {
    let state = createInitialState(createMap(20, 20));
    state = { ...state, map: { ...state.map, fogOfWar: true } };
    state = placeUnit(state, 'scout', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 3, row: 0 }, 'red');

    expect(visibleUnitAt(state, { col: 3, row: 0 }, 'blue')?.kind).toBe('tank');
    expect(visibleUnitAt(state, { col: 3, row: 0 }, 'red')?.kind).toBe('tank');
  });
});
