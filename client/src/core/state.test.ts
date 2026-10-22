import { describe, expect, it } from 'vitest';
import { createMap } from './map';
import {
  clearUnits,
  createInitialState,
  findUnitAt,
  placeUnit,
  removeUnitAt,
} from './state';

describe('placeUnit', () => {
  it('stawia jednostkę na wolnym heksie', () => {
    const state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue');

    expect(state.units).toHaveLength(1);
    expect(state.units[0]?.pos).toEqual({ col: 2, row: 3 });
    expect(state.units[0]?.faction).toBe('blue');
    expect(state.units[0]?.hp).toBe(10);
  });

  it('zastępuje jednostkę stojącą na tym samym heksie', () => {
    const first = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 1, row: 1 }, 'blue');
    const second = placeUnit(first, 'tank', { col: 1, row: 1 }, 'red');

    expect(second.units).toHaveLength(1);
    expect(second.units[0]?.kind).toBe('tank');
    expect(second.units[0]?.faction).toBe('red');
  });

  it('nadaje unikalne identyfikatory', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 1, row: 0 }, 'blue');

    expect(state.units.map((unit) => unit.id)).toEqual(['u1', 'u2']);
  });
});

describe('findUnitAt', () => {
  it('znajduje jednostkę na heksie', () => {
    const state = placeUnit(createInitialState(createMap(10, 10)), 'scout', { col: 4, row: 5 }, 'red');

    expect(findUnitAt(state, { col: 4, row: 5 })?.kind).toBe('scout');
    expect(findUnitAt(state, { col: 4, row: 6 })).toBeUndefined();
  });
});

describe('removeUnitAt', () => {
  it('usuwa jednostkę z heksa', () => {
    const state = placeUnit(createInitialState(createMap(10, 10)), 'tank', { col: 2, row: 2 }, 'blue');

    expect(removeUnitAt(state, { col: 2, row: 2 }).units).toHaveLength(0);
  });

  it('nie tworzy nowego stanu, gdy nic nie ma na heksie', () => {
    const state = createInitialState(createMap(10, 10));

    expect(removeUnitAt(state, { col: 2, row: 2 })).toBe(state);
  });
});

describe('clearUnits', () => {
  it('czyści wszystkie jednostki', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 5, row: 5 }, 'red');

    expect(clearUnits(state).units).toHaveLength(0);
  });
});
