import { describe, expect, it } from 'vitest';
import { createMap, removeTerrain, setTerrain } from '../../../src/core/map';
import {
  canMoveUnit,
  findUnitAt,
  getMoveCost,
  getMovePath,
  moveTargets,
  moveUnit,
} from '../../../src/core/map/movement';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { IMPASSABLE } from '../../../src/core/map/terrain';

describe('findUnitAt', () => {
  it('znajduje jednostkę na heksie', () => {
    const state = placeUnit(createInitialState(createMap(10, 10)), 'scout', { col: 4, row: 5 }, 'red');

    expect(findUnitAt(state, { col: 4, row: 5 })?.kind).toBe('scout');
    expect(findUnitAt(state, { col: 4, row: 6 })).toBeUndefined();
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
describe('getMoveCost', () => {
  it('zwraca koszt terenu, a dla brakującego kafla IMPASSABLE', () => {
    let map = createMap(4, 4);
    map = setTerrain(map, { col: 1, row: 0 }, 'forest');
    map = setTerrain(map, { col: 2, row: 0 }, 'water');
    const state = createInitialState(map);

    expect(getMoveCost(state, { col: 0, row: 0 })).toBe(1);
    expect(getMoveCost(state, { col: 1, row: 0 })).toBe(2);
    expect(getMoveCost(state, { col: 2, row: 0 })).toBe(IMPASSABLE);
    expect(getMoveCost(state, { col: 4, row: 0 })).toBe(IMPASSABLE);
  });
});

describe('canMoveUnit', () => {
  it('wymaga sąsiedniego heksa', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    const unit = state.units[0]!;

    expect(canMoveUnit(state, unit, { col: 3, row: 3 })).toBe(true);
    expect(canMoveUnit(state, unit, { col: 2, row: 3 })).toBe(false);
    expect(canMoveUnit(state, unit, { col: 4, row: 3 })).toBe(false);
  });

  it('odrzuca heks zajęty przez inną jednostkę', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    state = placeUnit(state, 'tank', { col: 3, row: 3 }, 'red');

    expect(canMoveUnit(state, state.units[0]!, { col: 3, row: 3 })).toBe(false);
  });

  it('odrzuca cel droższy niż pozostały ruch', () => {
    const map = setTerrain(createMap(10, 10), { col: 3, row: 3 }, 'mountain');
    const state = placeUnit(createInitialState(map), 'artillery', { col: 2, row: 3 }, 'blue');
    const unit = state.units[0]!;

    expect(canMoveUnit(state, unit, { col: 3, row: 3 })).toBe(false);
    expect(canMoveUnit(state, unit, { col: 1, row: 3 })).toBe(true);
  });

  it('odrzuca heks bez kafla', () => {
    const map = removeTerrain(createMap(4, 4), { col: 1, row: 0 });
    const state = placeUnit(createInitialState(map), 'infantry', { col: 0, row: 0 }, 'blue');

    expect(canMoveUnit(state, state.units[0]!, { col: 1, row: 0 })).toBe(false);
  });

  it('pozwala wydać cały pozostały ruch na jeden heks', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );

    for (const col of [3, 4, 5]) {
      state = moveUnit(state, state.units[0]!.id, { col, row: 3 });
    }

    const unit = state.units[0]!;

    expect(unit.movesLeft).toBe(1);
    expect(canMoveUnit(state, unit, { col: 6, row: 3 })).toBe(true);
  });

  it('odrzuca jednostkę, która zużyła ruch', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );

    for (const col of [3, 4, 5, 6]) {
      state = moveUnit(state, state.units[0]!.id, { col, row: 3 });
    }

    const unit = state.units[0]!;

    expect(unit.hasActed).toBe(true);
    expect(unit.movesLeft).toBe(0);
    expect(canMoveUnit(state, unit, { col: 7, row: 3 })).toBe(false);
    expect(moveTargets(state, unit)).toEqual([]);
  });
});

describe('getMovePath', () => {
  it('zwraca trasę do celu', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );

    expect(getMovePath(state, state.units[0]!, { col: 4, row: 3 })).toEqual([
      { col: 3, row: 3 },
      { col: 4, row: 3 },
    ]);
  });

  it('odrzuca ten sam heks, wodę i heks zajęty', () => {
    const map = setTerrain(createMap(10, 10), { col: 2, row: 4 }, 'water');
    let state = placeUnit(createInitialState(map), 'infantry', { col: 2, row: 3 }, 'blue');
    const unit = state.units[0]!;

    expect(getMovePath(state, unit, { col: 2, row: 3 })).toBeUndefined();
    expect(getMovePath(state, unit, { col: 2, row: 4 })).toBeUndefined();

    state = placeUnit(state, 'tank', { col: 3, row: 3 }, 'red');
    const kept = state.units.find((candidate) => candidate.id === unit.id)!;

    expect(getMovePath(state, kept, { col: 3, row: 3 })).toBeUndefined();
  });

  it('odrzuca cel poza zasięgiem ruchu', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 0, row: 0 },
      'blue',
    );

    expect(getMovePath(state, state.units[0]!, { col: 9, row: 9 })).toBeUndefined();
  });
});

describe('moveUnit — wybór jednostki', () => {
  it('zwraca ten sam stan dla nieznanego identyfikatora', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );

    expect(moveUnit(state, 'nie-ma-takiej', { col: 3, row: 3 })).toBe(state);
  });

  it('przesuwa tylko wybraną jednostkę', () => {
    let state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    state = placeUnit(state, 'tank', { col: 5, row: 5 }, 'red');

    const moved = moveUnit(state, state.units[0]!.id, { col: 3, row: 3 });

    expect(findUnitAt(moved, { col: 5, row: 5 })?.kind).toBe('tank');
    expect(findUnitAt(moved, { col: 2, row: 3 })).toBeUndefined();
    expect(findUnitAt(moved, { col: 3, row: 3 })?.kind).toBe('infantry');
  });
});

describe('moveTargets — przeszkody', () => {
  it('pomija wodę i heksy zajęte przez inne jednostki', () => {
    const map = setTerrain(createMap(5, 5), { col: 2, row: 1 }, 'water');
    let state = placeUnit(createInitialState(map), 'infantry', { col: 1, row: 1 }, 'blue');
    state = placeUnit(state, 'tank', { col: 1, row: 2 }, 'red');

    const targets = moveTargets(state, state.units[0]!);

    expect(targets).toContainEqual({ col: 0, row: 1 });
    expect(targets).not.toContainEqual({ col: 2, row: 1 });
    expect(targets).not.toContainEqual({ col: 1, row: 2 });
  });
});

describe('getMovePath — równe koszty', () => {
  it('zachowuje pierwszą znalezioną trasę', () => {
    const state = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 0, row: 0 },
      'blue',
    );

    expect(getMovePath(state, state.units[0]!, { col: 1, row: 1 })).toEqual([
      { col: 1, row: 0 },
      { col: 1, row: 1 },
    ]);
  });
});

describe('jednostka oznaczona jako działająca', () => {
  it('nie może się ruszyć mimo pozostałego ruchu', () => {
    const base = placeUnit(
      createInitialState(createMap(10, 10)),
      'infantry',
      { col: 2, row: 3 },
      'blue',
    );
    const acted = { ...base.units[0]!, hasActed: true, movesLeft: 4 };
    const state = { ...base, units: [acted] };

    expect(canMoveUnit(state, acted, { col: 3, row: 3 })).toBe(false);
    expect(getMovePath(state, acted, { col: 3, row: 3 })).toBeUndefined();
    expect(moveTargets(state, acted)).toEqual([]);
    expect(moveUnit(state, acted.id, { col: 3, row: 3 })).toBe(state);
  });
});
