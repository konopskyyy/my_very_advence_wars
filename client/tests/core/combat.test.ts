import { describe, expect, it } from 'vitest';
import { attackUnit, canAttack, canAttackThisTurn } from '../../src/core/combat';
import { createMap, findUnitAt, type HexCoord } from '../../src/core/map';
import { createInitialState, placeUnit, type GameState } from '../../src/core/state';
import {
  ARTILLERY_AMMO,
  ARTILLERY_SHOT_MOVE_COST,
  ARTILLERY_STATS,
  createUnit,
  FULL_MAP_RANGE,
  shotMoveCost,
  shotsLeft,
  TANK_AMMO,
  UNIT_DEFS,
  type UnitKind,
} from '../../src/core/units';

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
      { kind: 'infantry', pos: { col: 7, row: 4 } },
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

  it('artyleria sięga każdego heksa mapy', () => {
    const target = createUnit('target', 'infantry', 'red', { col: 0, row: 0 });
    const artillery = createUnit('artillery', 'artillery', 'blue', { col: 40, row: 20 });

    expect(UNIT_DEFS.artillery.attackRange).toBe(FULL_MAP_RANGE);
    expect(UNIT_DEFS.artillery.visionRange).toBe(FULL_MAP_RANGE);
    expect(Number.isFinite(UNIT_DEFS.artillery.attackRange)).toBe(true);
    expect(Number.isFinite(UNIT_DEFS.artillery.visionRange)).toBe(true);
    expect(canAttack(artillery, target)).toBe(true);
  });
});

describe('canAttackThisTurn', () => {
  it('pozwala atakować jednostce gotowej do akcji', () => {
    const unit = createUnit('unit', 'infantry', 'blue', { col: 4, row: 4 });

    expect(canAttackThisTurn(unit)).toBe(true);
  });

  it('blokuje jednostkę, która już działała', () => {
    const unit = { ...createUnit('unit', 'infantry', 'blue', { col: 4, row: 4 }), hasActed: true };

    expect(canAttackThisTurn(unit)).toBe(false);
  });

  it('blokuje jednostkę bez dostępnego strzału', () => {
    const unit = { ...createUnit('unit', 'tank', 'blue', { col: 4, row: 4 }), movesLeft: 0 };

    expect(canAttackThisTurn(unit)).toBe(false);
  });

  it('liczy piechocie strzały z pozostałego ruchu', () => {
    const unit = createUnit('unit', 'infantry', 'blue', { col: 4, row: 4 });

    expect(shotsLeft(unit)).toBe(UNIT_DEFS.infantry.moveRange);
    expect(canAttackThisTurn(unit)).toBe(true);
    expect(canAttackThisTurn({ ...unit, movesLeft: 0 })).toBe(false);
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

  it('odejmuje koszt strzału i zostawia resztę ruchu', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);

    expect(findUnitAt(next, attacker!.pos)).toMatchObject({
      movesLeft: UNIT_DEFS.infantry.moveRange - shotMoveCost(UNIT_DEFS.infantry),
      hasActed: false,
    });
  });

  it('pozwala atakować, dopóki starcza ruchu', () => {
    let state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    state = withHp(state, { col: 5, row: 4 }, 1000);

    for (let shot = 0; shot < UNIT_DEFS.infantry.moveRange; shot += 1) {
      const attacker = findUnitAt(state, { col: 4, row: 4 })!;
      const target = findUnitAt(state, { col: 5, row: 4 })!;

      expect(canAttack(attacker, target)).toBe(true);
      state = attackUnit(state, attacker.id, target.id);
    }

    const attacker = findUnitAt(state, { col: 4, row: 4 })!;
    const target = findUnitAt(state, { col: 5, row: 4 })!;

    expect(attacker).toMatchObject({ movesLeft: 0, hasActed: true });
    expect(canAttack(attacker, target)).toBe(false);
  });

  it('artyleria po strzale traci część ruchu zamiast kończyć turę', () => {
    const state = stateWith(
      { kind: 'artillery', pos: { col: 0, row: 0 } },
      { kind: 'infantry', pos: { col: 8, row: 8 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);

    expect(findUnitAt(next, attacker!.pos)).toMatchObject({
      movesLeft: ARTILLERY_STATS.moveRange - ARTILLERY_SHOT_MOVE_COST,
      hasActed: false,
    });
    expect(shotsLeft(findUnitAt(next, attacker!.pos)!)).toBe(ARTILLERY_AMMO - 1);
  });

  it('artyleria strzela aż wyczerpie ruch i amunicję', () => {
    let state = stateWith(
      { kind: 'artillery', pos: { col: 0, row: 0 } },
      { kind: 'infantry', pos: { col: 8, row: 8 } },
    );
    state = withHp(state, { col: 8, row: 8 }, 1000);

    for (let shot = 0; shot < ARTILLERY_AMMO; shot += 1) {
      const attacker = findUnitAt(state, { col: 0, row: 0 })!;
      const target = findUnitAt(state, { col: 8, row: 8 })!;

      expect(canAttack(attacker, target)).toBe(true);
      state = attackUnit(state, attacker.id, target.id);
    }

    expect(findUnitAt(state, { col: 0, row: 0 })).toMatchObject({
      movesLeft: 0,
      hasActed: true,
    });
    expect(shotsLeft(findUnitAt(state, { col: 0, row: 0 })!)).toBe(0);
    expect(findUnitAt(state, { col: 8, row: 8 })?.hp).toBe(
      1000 - ARTILLERY_AMMO * ARTILLERY_STATS.attack,
    );
    expect(
      canAttack(
        findUnitAt(state, { col: 0, row: 0 })!,
        findUnitAt(state, { col: 8, row: 8 })!,
      ),
    ).toBe(false);
  });

  it('nie pozwala atakować bez dostępnego strzału', () => {
    const state = stateWith(
      { kind: 'artillery', pos: { col: 0, row: 0 } },
      { kind: 'infantry', pos: { col: 8, row: 8 } },
    );
    const empty = {
      ...state,
      units: state.units.map((unit) =>
        unit.kind === 'artillery' ? { ...unit, movesLeft: 0 } : unit,
      ),
    };
    const [attacker, target] = empty.units;

    expect(canAttack(attacker!, target!)).toBe(false);
    expect(attackUnit(empty, attacker!.id, target!.id)).toBe(empty);
  });

  it('czołg po ataku zachowuje resztę ruchu i pocisków', () => {
    const state = stateWith(
      { kind: 'tank', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);
    const acted = findUnitAt(next, attacker!.pos)!;

    expect(acted).toMatchObject({
      movesLeft: UNIT_DEFS.tank.moveRange - shotMoveCost(UNIT_DEFS.tank),
      hasActed: false,
    });
    expect(shotsLeft(acted)).toBe(TANK_AMMO - 1);
  });

  it('piechota po ataku zachowuje resztę ruchu', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 5, row: 4 } },
    );
    const [attacker, target] = state.units;
    const next = attackUnit(state, attacker!.id, target!.id);

    expect(findUnitAt(next, attacker!.pos)).toMatchObject({
      movesLeft: UNIT_DEFS.infantry.moveRange - shotMoveCost(UNIT_DEFS.infantry),
      hasActed: false,
    });
  });

  it('zwraca ten sam stan, gdy cel jest poza zasięgiem', () => {
    const state = stateWith(
      { kind: 'infantry', pos: { col: 4, row: 4 } },
      { kind: 'infantry', pos: { col: 7, row: 4 } },
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
