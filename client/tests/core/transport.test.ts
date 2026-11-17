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
  unloadPassenger,
  unloadTargets,
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
  it('pozwala piechocie i zwiadowcy wsiąść do czołgu, a zwiadowca nikogo nie przewozi', () => {
    const state = pair();
    const infantry = state.units[0]!;
    const tank = state.units[1]!;
    const withScout = placeUnit(state, 'scout', { col: 6, row: 3 }, 'blue');
    const scout = withScout.units.find((unit) => unit.kind === 'scout')!;

    expect(canCarry(tank, infantry)).toBe(true);
    expect(canCarry(tank, scout)).toBe(true);
    expect(canBoard(tank, scout)).toBe(true);
    expect(canCarry(infantry, tank)).toBe(false);
    expect(canCarry(scout, infantry)).toBe(false);
    expect(freeCargoSlots(tank)).toBe(3);
    expect(freeCargoSlots(scout)).toBe(0);
    expect(cargoCount(tank)).toBe(0);
    expect(boardingPath(withScout, infantry, scout)).toBeUndefined();
    expect(boardingPath(withScout, scout, tank)).toEqual([
      { col: 5, row: 3 },
      { col: 4, row: 3 },
    ]);
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
    expect(freeCargoSlots(loadedTank)).toBe(2);
  });

  it('mieści trzech piechurów, a czwartego odrzuca', () => {
    const state = placeUnit(
      placeUnit(
        placeUnit(pair(), 'infantry', { col: 2, row: 4 }, 'blue'),
        'infantry',
        { col: 2, row: 5 },
        'blue',
      ),
      'infantry',
      { col: 2, row: 6 },
      'blue',
    );
    const tank = state.units.find((unit) => unit.kind === 'tank')!;
    const infantry = state.units.filter((unit) => unit.kind === 'infantry');
    let loaded = state;

    for (const passenger of infantry.slice(0, 3)) {
      loaded = loadPassenger(loaded, passenger.id, tank.id);
    }

    const fullTank = loaded.units.find((unit) => unit.id === tank.id)!;

    expect(fullTank.cargo).toHaveLength(3);
    expect(freeCargoSlots(fullTank)).toBe(0);
    expect(canCarry(fullTank, infantry[3]!)).toBe(false);
    expect(loadPassenger(loaded, infantry[3]!.id, tank.id)).toBe(loaded);
  });

  it('wyładowuje wskazanego pasażera na sąsiedni wolny heks bez ruchu i akcji', () => {
    const state = pair();
    const infantry = state.units[0]!;
    const tank = state.units[1]!;
    const loaded = loadPassenger(state, infantry.id, tank.id);
    const vehicle = loaded.units.find((unit) => unit.id === tank.id)!;
    const target = unloadTargets(loaded, vehicle)[0]!;
    const unloaded = unloadPassenger(loaded, tank.id, infantry.id, target);
    const returned = unloaded.units.find((unit) => unit.id === infantry.id)!;

    expect(unloaded.units).toHaveLength(2);
    expect(hexNeighbors(tank.pos).some((coord) => coord.col === returned.pos.col && coord.row === returned.pos.row)).toBe(true);
    expect(returned.movesLeft).toBe(0);
    expect(returned.hasActed).toBe(true);
    expect(unloaded.units.find((unit) => unit.id === tank.id)?.cargo).toBeUndefined();
  });

  it('nie wyładowuje na zajęty lub odległy heks', () => {
    const state = pair();
    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);
    const tank = loaded.units.find((unit) => unit.kind === 'tank')!;

    expect(unloadPassenger(loaded, tank.id, state.units[0]!.id, { col: 9, row: 9 })).toBe(loaded);
  });

  it('nie ma wolnych heksów wyładunku, gdy otoczenie jest wodą', () => {
    let map = createMap(5, 5);

    for (const coord of hexNeighbors({ col: 2, row: 2 })) {
      map = setTerrain(map, coord, 'water');
    }

    let state = placeUnit(createInitialState(map), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'tank', { col: 2, row: 2 }, 'blue');

    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);
    const tank = loaded.units.find((unit) => unit.kind === 'tank')!;

    expect(unloadTargets(loaded, tank)).toEqual([]);
  });

  it('nie wyładowuje pasażera automatycznie na początku tury', () => {
    const state = pair();
    const loaded = loadPassenger(state, state.units[0]!.id, state.units[1]!.id);
    const next = beginTurn(loaded, 'blue');

    expect(next.units.filter((unit) => unit.kind === 'infantry')).toHaveLength(0);
    expect(next.units.find((unit) => unit.kind === 'tank')?.cargo).toHaveLength(1);
  });
});
