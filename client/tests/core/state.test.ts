import { describe, expect, it } from 'vitest';
import { createMap, setTerrain } from '../../src/core/map';
import {
  canMoveUnit,
  clearUnits,
  countUnits,
  createInitialState,
  deployUnits,
  findUnitAt,
  moveTargets,
  moveUnit,
  placeUnit,
  removeUnitAt,
} from '../../src/core/state';

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

describe('deployUnits', () => {
  it('stawia całe rozstawienie jednej strony', () => {
    const state = deployUnits(createInitialState(createMap(10, 10)), 'red', [
      { kind: 'infantry', col: 2, row: 3 },
      { kind: 'tank', col: 4, row: 5 },
    ]);

    expect(state.units).toHaveLength(2);
    expect(state.units.every((unit) => unit.faction === 'red')).toBe(true);
    expect(state.units.map((unit) => unit.pos)).toEqual([
      { col: 2, row: 3 },
      { col: 4, row: 5 },
    ]);
  });

  it('liczy identyfikatory kolejno w całym stanie', () => {
    let state = deployUnits(createInitialState(createMap(10, 10)), 'blue', [
      { kind: 'infantry', col: 0, row: 0 },
    ]);
    state = deployUnits(state, 'red', [{ kind: 'scout', col: 5, row: 5 }]);

    expect(state.units.map((unit) => unit.id)).toEqual(['u1', 'u2']);
  });
});

describe('countUnits', () => {
  it('liczy jednostki obu stron', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 1, row: 0 }, 'blue');
    state = placeUnit(state, 'scout', { col: 2, row: 0 }, 'red');

    expect(countUnits(state.units)).toEqual({ blue: 2, red: 1, total: 3 });
  });

  it('zwraca zera dla pustej listy', () => {
    expect(countUnits([])).toEqual({ blue: 0, red: 0, total: 0 });
  });
});

describe('ruch jednostek', () => {
  it('przesuwa jednostkę na sąsiedni heks z uwagą na koszt terenu', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    const unit = state.units[0]!;
    const moved = moveUnit(state, unit.id, { col: 3, row: 3 });

    expect(moved).not.toBe(state);
    expect(findUnitAt(moved, { col: 2, row: 3 })).toBeUndefined();
    expect(findUnitAt(moved, { col: 3, row: 3 })).toMatchObject({
      id: unit.id,
      movesLeft: 3,
      hasActed: false,
    });
  });

  it('kończy działanie jednostki gdy zużyje cały ruch', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    const unit = state.units[0]!;
    state = moveUnit(state, unit.id, { col: 3, row: 3 });
    state = moveUnit(state, unit.id, { col: 4, row: 3 });
    state = moveUnit(state, unit.id, { col: 5, row: 3 });
    const moved = moveUnit(state, state.units[0]!.id, { col: 6, row: 3 });

    expect(findUnitAt(moved, { col: 6, row: 3 })).toMatchObject({
      movesLeft: 0,
      hasActed: true,
    });
  });

  it('nie pozwala ruszyć się poza zasięg ruchu', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    expect(moveUnit(state, state.units[0]!.id, { col: 8, row: 3 })).toBe(state);
  });

  it('nie pozwala wejść na zajęty heks', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    state = placeUnit(state, 'tank', { col: 3, row: 3 }, 'red');

    expect(moveUnit(state, state.units[0]!.id, { col: 3, row: 3 })).toBe(state);
  });

  it('nie pozwala wejść na wodę', () => {
    const map = setTerrain(createMap(10, 10), { col: 3, row: 3 }, 'water');
    const state = placeUnit(createInitialState(map), 'infantry', { col: 2, row: 3 }, 'blue');

    expect(canMoveUnit(state, state.units[0]!, { col: 3, row: 3 })).toBe(false);
    expect(moveUnit(state, state.units[0]!.id, { col: 3, row: 3 })).toBe(state);
  });

  it('nie rusza jednostki, która już działała w tej turze', () => {
    let start = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    start = moveUnit(start, start.units[0]!.id, { col: 3, row: 3 });
    start = moveUnit(start, start.units[0]!.id, { col: 4, row: 3 });
    start = moveUnit(start, start.units[0]!.id, { col: 5, row: 3 });
    const moved = moveUnit(start, start.units[0]!.id, { col: 6, row: 3 });

    expect(moveUnit(moved, moved.units[0]!.id, { col: 7, row: 3 })).toBe(moved);
  });

  it('zwraca heksy w zasięgu ruchu', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 0, row: 0 },
      'blue',
    );

    expect(moveTargets(state, state.units[0]!)).toEqual(
      expect.arrayContaining([
        { col: 1, row: 0 },
        { col: 0, row: 1 },
      ]),
    );
    expect(moveTargets(state, state.units[0]!)).toHaveLength(18);
  });

  it('wybiera najtańszą trasę zamiast najkrótszej', () => {
    const map = setTerrain(createMap(10, 10), { col: 1, row: 0 }, 'mountain');
    const state = placeUnit(createInitialState(map), 'infantry', { col: 0, row: 0 }, 'blue');
    const moved = moveUnit(state, state.units[0]!.id, { col: 2, row: 0 });

    expect(findUnitAt(moved, { col: 2, row: 0 })).toMatchObject({
      movesLeft: 1,
      hasActed: false,
    });
  });
});
