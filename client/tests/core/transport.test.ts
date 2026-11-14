import { describe, expect, it } from 'vitest';
import { createMap, hexNeighbors, setTerrain } from '../../src/core/map';
import { createInitialState, placeUnit, type GameState } from '../../src/core/state';
import {
  boardingPath,
  canBoard,
  canCarry,
  cargoCount,
  freeCargoSlots,
  loadPassenger,
  unloadCargo,
} from '../../src/core/transport';
import { beginTurn } from '../../src/core/turn';

function pair(): GameState {
  return placeUnit(
    placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue'),
    'tank',
    { col: 4, row: 3 },
    'blue',
  );
}

describe('transport', () => {
  it('pozwala tylko piechocie wsiąść do czołgu lub zwiadowcy', () => {
    const state = pair();
    const infantry = state.units[0]!;
    const tank = state.units[1]!;

    expect(canCarry(tank, infantry)).toBe(true);
    expect(canCarry(infantry, tank)).toBe(false);
    expect(freeCargoSlots(tank)).toBe(1);
    expect(cargoCount(tank)).toBe(0);
  });

  it('wymaga pojazdu osiągalnego w pozostałym ruchu', () => {
    const near = pair();
    const nearInfantry = near.units[0]!;
    const nearTank = near.units[1]!;

    expect(boardingPath(near, nearInfantry, nearTank)).toEqual([
      { col: 3, row: 3 },
      { col: 4, row: 3 },
    ]);

    const far = placeUnit(
      placeUnit(createInitialState(createMap(12, 10)), 'infantry', { col: 0, row: 0 }, 'blue'),
      'tank',
      { col: 8, row: 0 },
      'blue',
    );

    expect(boardingPath(far, far.units[0]!, far.units[1]!)).toBeUndefined();
    expect(canBoard(far.units[1]!, far.units[0]!)).toBe(true);
  });

  it('nie wsiada jednostka, która już działała', () => {
    const state = pair();
    const spent = { ...state.units[0]!, movesLeft: 0, hasActed: true };

    expect(canBoard(state.units[1]!, spent)).toBe(false);
  });

  it('przenosi pasażera do ładunku i zwalnia jego heks', () => {
    const state = pair();
    const infantry = state.units[0]!;
    const tank = state.units[1]!;
    const loaded = loadPassenger(state, infantry.id, tank.id);
    const loadedTank = loaded.units.find((unit) => unit.id === tank.id)!;

    expect(loaded.units).toHaveLength(1);
    expect(loadedTank.cargo).toHaveLength(1);
    expect(loadedTank.cargo?.[0]?.kind).toBe('infantry');
    expect(freeCargoSlots(loadedTank)).toBe(0);
  });

  it('wyładowuje pasażera na pierwszy wolny sąsiedni heks', () => {
    const state = pair();
    const infantry = state.units[0]!;
    const tank = state.units[1]!;
    const loaded = loadPassenger(state, infantry.id, tank.id);
    const unloaded = unloadCargo(loaded, 'blue');
    const returned = unloaded.units.find((unit) => unit.kind === 'infantry')!;

    expect(unloaded.units).toHaveLength(2);
    expect(hexNeighbors(tank.pos).some((coord) => coord.col === returned.pos.col && coord.row === returned.pos.row)).toBe(true);
    expect(unloaded.units.find((unit) => unit.id === tank.id)?.cargo).toBeUndefined();
  });

  it('zostawia pasażera w pojeździe, gdy nie ma wolnego heksu', () => {
    let map = createMap(5, 5);

    for (const coord of hexNeighbors({ col: 2, row: 2 })) {
      map = setTerrain(map, coord, 'water');
    }

    let state = placeUnit(createInitialState(map), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'tank', { col: 2, row: 2 }, 'blue');

    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);
    const unloaded = unloadCargo(loaded, 'blue');

    expect(unloaded).toBe(loaded);
    expect(unloaded.units.find((unit) => unit.kind === 'tank')?.cargo).toHaveLength(1);
  });

  it('wyładowuje pasażera na początku tury właściciela', () => {
    const state = pair();
    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);
    const next = beginTurn(loaded, 'blue');

    expect(next.units.filter((unit) => unit.kind === 'infantry')).toHaveLength(1);
    expect(next.units.find((unit) => unit.kind === 'tank')?.cargo).toBeUndefined();
  });

  it('nie wyładowuje pasażera w turze przeciwnika', () => {
    const state = pair();
    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);

    expect(unloadCargo(loaded, 'red')).toBe(loaded);
  });
});
