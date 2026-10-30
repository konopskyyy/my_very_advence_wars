import { describe, expect, it } from 'vitest';
import { createMap, removeTerrain, setTerrain } from '../../src/core/map';
import {
  canMoveUnit,
  clearUnits,
  countUnits,
  createInitialState,
  deployUnits,
  findUnitAt,
  getMoveCost,
  getMovePath,
  moveTargets,
  moveUnit,
  placeUnit,
  removeUnitAt,
} from '../../src/core/state';
import { IMPASSABLE } from '../../src/core/terrain';

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

  it('nie tworzy nowego stanu, gdy nie ma jednostek', () => {
    const state = createInitialState(createMap(10, 10));

    expect(clearUnits(state)).toBe(state);
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

describe('sąsiedzi przy podmianie jednostek', () => {
  function threeUnits() {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 2, row: 2 }, 'blue');
    state = placeUnit(state, 'tank', { col: 2, row: 3 }, 'red');
    state = placeUnit(state, 'scout', { col: 3, row: 2 }, 'blue');

    return state;
  }

  it('usuwa tylko jednostkę z podanego heksa', () => {
    const state = removeUnitAt(threeUnits(), { col: 2, row: 2 });

    expect(state.units.map((unit) => unit.pos)).toEqual([
      { col: 2, row: 3 },
      { col: 3, row: 2 },
    ]);
  });

  it('zastępuje jednostkę bez ruszania sąsiadów w rzędzie i kolumnie', () => {
    const state = placeUnit(threeUnits(), 'artillery', { col: 2, row: 2 }, 'blue');

    expect(state.units.map((unit) => unit.pos)).toEqual([
      { col: 2, row: 3 },
      { col: 3, row: 2 },
      { col: 2, row: 2 },
    ]);
    expect(state.units.map((unit) => unit.kind)).toEqual(['tank', 'scout', 'artillery']);
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

