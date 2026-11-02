import { describe, expect, it } from 'vitest';
import { attackUnit, canAttack } from '../../src/core/combat';
import { createMap, findUnitAt, type HexCoord } from '../../src/core/map';
import { createInitialState, placeUnit, type GameState } from '../../src/core/state';
import { createUnit, UNIT_DEFS, type UnitKind } from '../../src/core/units';

function stateWith(
  blue: { kind: UnitKind; pos: HexCoord },
  red: { kind: UnitKind; pos: HexCoord },
): GameState {
  const withBlue = placeUnit(createInitialState(createMap(9, 9)), blue.kind, blue.pos, 'blue');

  return placeUnit(withBlue, red.kind, red.pos, 'red');
}

function hpOf(state: GameState, coord: HexCoord): number | undefined {
  return findUnitAt(state, coord)?.hp;
}

function withHp(state: GameState, coord: HexCoord, hp: number): GameState {
  return {
    ...state,
    units: state.units.map((unit) =>
      unit.pos.col === coord.col && unit.pos.row === coord.row ? { ...unit, hp } : unit,
    ),
  };
}

describe('canAttack', () => {
  it('pozwala zaatakować wroga w zasięgu', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );

    expect(canAttack(state.units[0]!, state.units[1]!)).toBe(true);
  });

  it('odrzuca cel poza zasięgiem', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 6, row: 4 } },
    );

    expect(canAttack(state.units[0]!, state.units[1]!)).toBe(false);
  });

  it('odrzuca własną jednostkę', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'tank', pos: { col: 4, row: 5 } },
    );
    const own = placeUnit(state, 'infantry', { col: 5, row: 4 }, 'blue');

    expect(canAttack(own.units[0]!, own.units[2]!)).toBe(false);
  });

  it('odrzuca jednostkę, która już działała', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const acted = { ...state.units[0]!, hasActed: true };

    expect(canAttack(acted, state.units[1]!)).toBe(false);
  });

  it('artyleria sięga dalej niż piechota', () => {
    const target = createUnit('target', 'infantry', 'red', { col: 7, row: 4 });
    const artillery = createUnit('artillery', 'artillery', 'blue', { col: 4, row: 4 });
    const infantry = createUnit('infantry', 'infantry', 'blue', { col: 4, row: 4 });

    expect(canAttack(artillery, target)).toBe(true);
    expect(canAttack(infantry, target)).toBe(false);
  });
});

describe('attackUnit', () => {
  it('odejmuje od HP celu wartość ataku atakującego', () => {
    const state = stateWith(
      { kind: 'tank', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);

    expect(hpOf(next, target!.pos)).toBe(UNIT_DEFS.infantry.maxHp - UNIT_DEFS.tank.attack);
  });

  it('usuwa jednostkę, której HP spadło do zera lub niżej', () => {
    const state = stateWith(
      { kind: 'tank', pos: { col: 4, row: 4 } },
      { kind: 'scout', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const wounded = withHp(state, target!.pos, UNIT_DEFS.tank.attack);
    const next = attackUnit(wounded, attacker!.id, target!.id);

    expect(findUnitAt(next, target!.pos)).toBeUndefined();
    expect(next.units).toHaveLength(1);
  });

  it('oznacza atakującego jako tego, który już działał', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);

    expect(findUnitAt(next, attacker!.pos)?.hasActed).toBe(true);
  });

  it('nie pozwala zaatakować dwa razy w tej samej turze', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const once = attackUnit(state, attacker!.id, target!.id);
    const twice = attackUnit(once, attacker!.id, target!.id);

    expect(twice).toBe(once);
  });

  it('zwraca ten sam stan, gdy cel jest poza zasięgiem', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 6, row: 4 } },
    );
    const [attacker, target] = state.units;

    expect(attackUnit(state, attacker!.id, target!.id)).toBe(state);
  });

  it('zwraca ten sam stan dla nieistniejącej jednostki', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );

    expect(attackUnit(state, 'brak', 'tez-brak')).toBe(state);
  });
});
