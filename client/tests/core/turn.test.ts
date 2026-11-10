import { describe, expect, it } from 'vitest';
import { createMap } from '../../src/core/map';
import { createInitialState, placeUnit, type GameState } from '../../src/core/state';
import { beginTurn, createTurnState, isActiveFaction, nextTurn } from '../../src/core/turn';
import { ARTILLERY_AMMO, ARTILLERY_STATS, shotsLeft } from '../../src/core/units';

function spent(state: GameState): GameState {
  return {
    ...state,
    units: state.units.map((unit) => ({ ...unit, movesLeft: 0, hasActed: true })),
  };
}

describe('createTurnState', () => {
  it('zaczyna od niebieskiej strony i pierwszej tury', () => {
    expect(createTurnState()).toEqual({ faction: 'blue', turn: 1 });
  });
});

describe('nextTurn', () => {
  it('przełącza strony i zwiększa numer tury', () => {
    const first = nextTurn(createTurnState());
    const second = nextTurn(first);

    expect(first).toEqual({ faction: 'red', turn: 2 });
    expect(second).toEqual({ faction: 'blue', turn: 3 });
  });
});

describe('beginTurn', () => {
  it('przywraca ruch i akcję tylko jednostkom aktywnej strony', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 5, row: 5 }, 'red');

    const reset = beginTurn(spent(state), 'blue');

    expect(reset.units[0]).toMatchObject({ faction: 'blue', movesLeft: 4, hasActed: false });
    expect(reset.units[1]).toMatchObject({ faction: 'red', movesLeft: 0, hasActed: true });
  });

  it('nie tworzy nowego stanu, gdy jednostki są już gotowe', () => {
    const state = placeUnit(createInitialState(createMap(10, 10)), 'scout', { col: 1, row: 1 }, 'blue');

    expect(beginTurn(state, 'blue')).toBe(state);
  });

  it('przywraca ruch i wynikające z niego pociski tylko jednostkom aktywnej strony', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'artillery', { col: 0, row: 0 }, 'blue');
    state = placeUnit(state, 'tank', { col: 5, row: 5 }, 'red');
    const spentAmmo = {
      ...state,
      units: state.units.map((unit) => ({ ...unit, movesLeft: 0, hasActed: true })),
    };
    const reset = beginTurn(spentAmmo, 'blue');
    const blue = reset.units[0]!;
    const red = reset.units[1]!;

    expect(blue).toMatchObject({
      faction: 'blue',
      movesLeft: ARTILLERY_STATS.moveRange,
      hasActed: false,
    });
    expect(shotsLeft(blue)).toBe(ARTILLERY_AMMO);
    expect(red).toMatchObject({
      faction: 'red',
      movesLeft: 0,
      hasActed: true,
    });
    expect(shotsLeft(red)).toBe(0);
  });
});

describe('isActiveFaction', () => {
  it('rozpoznaje aktywną stronę', () => {
    const turn = createTurnState();

    expect(isActiveFaction(turn, 'blue')).toBe(true);
    expect(isActiveFaction(turn, 'red')).toBe(false);
  });
});
