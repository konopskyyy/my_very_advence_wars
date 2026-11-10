import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import {
  addAttack,
  commitPlan,
  createTurnPlan,
  planVolley,
  setMove,
} from '../../../src/core/plan';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { createTurnState } from '../../../src/core/turn';

describe('wolumen i commit', () => {
  it('dwaj piechurzy rozstrzygają obrażenia z jednego snapshotu', () => {
    let state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 4, row: 3 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 3, row: 3 }, 'red');
    const [first, second, target] = state.units;
    const firstAttack = addAttack(createTurnPlan(createTurnState()), state, first!.id, target!.id);

    expect(firstAttack.ok).toBe(true);

    if (!firstAttack.ok) {
      return;
    }

    const secondAttack = addAttack(firstAttack.plan, state, second!.id, target!.id);

    expect(secondAttack.ok).toBe(true);

    if (!secondAttack.ok) {
      return;
    }

    const volley = planVolley(state, secondAttack.plan);

    expect(volley.hits).toHaveLength(2);
    expect(volley.damageByTarget.get(target!.id)).toBe(10);
    expect(volley.killed).toEqual([target!.id]);

    const committed = commitPlan(state, secondAttack.plan);

    expect(committed.killed).toEqual([target!.id]);
    expect(committed.state.units.map((unit) => unit.id)).toEqual([first!.id, second!.id]);
    expect(committed.state.units.every((unit) => unit.hasActed)).toBe(true);
    expect(state.units).toHaveLength(3);
  });

  it('nadmiarowe obrażenia nie zmieniają wyniku i nie tworzą dwóch śmierci', () => {
    let state = placeUnit(
      createInitialState(createMap(12, 12)),
      'artillery',
      { col: 1, row: 1 },
      'blue',
    );
    state = placeUnit(state, 'infantry', { col: 6, row: 6 }, 'red');
    const attacker = state.units[0]!;
    const target = state.units[1]!;
    const first = addAttack(createTurnPlan(createTurnState()), state, attacker.id, target.id);

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = addAttack(first.plan, state, attacker.id, target.id);

    expect(second.ok).toBe(true);

    if (!second.ok) {
      return;
    }

    const volley = planVolley(state, second.plan);

    expect(volley.hits).toHaveLength(2);
    expect(volley.damageByTarget.get(target.id)).toBe(24);
    expect(volley.killed).toEqual([target.id]);
    expect(commitPlan(state, second.plan).state.units.map((unit) => unit.id)).toEqual([attacker.id]);
  });

  it('kolejność jednostek w planie nie zmienia stanu końcowego', () => {
    let state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 4, row: 3 }, 'blue');
    state = placeUnit(state, 'artillery', { col: 3, row: 3 }, 'red');
    const [first, second, target] = state.units;
    const base = createTurnPlan(createTurnState());
    const forward = addAttack(base, state, first!.id, target!.id);

    expect(forward.ok).toBe(true);

    if (!forward.ok) {
      return;
    }

    const both = addAttack(forward.plan, state, second!.id, target!.id);

    expect(both.ok).toBe(true);

    if (!both.ok) {
      return;
    }

    const reversed = addAttack(base, state, second!.id, target!.id);

    expect(reversed.ok).toBe(true);

    if (!reversed.ok) {
      return;
    }

    const other = addAttack(reversed.plan, state, first!.id, target!.id);

    expect(other.ok).toBe(true);

    if (!other.ok) {
      return;
    }

    const one = commitPlan(state, both.plan).state;
    const two = commitPlan(state, other.plan).state;
    const normalize = (units: typeof one.units) =>
      [...units]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((unit) => ({ id: unit.id, hp: unit.hp, hasActed: unit.hasActed, pos: unit.pos }));

    expect(normalize(one.units)).toEqual(normalize(two.units));
  });

  it('commit przenosi jednostkę i zadaje obrażenia po ruchu', () => {
    let state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 4, row: 3 }, 'red');
    const attacker = state.units[0]!;
    const target = state.units[1]!;
    const moved = setMove(createTurnPlan(createTurnState()), state, attacker.id, { col: 3, row: 3 });

    expect(moved.ok).toBe(true);

    if (!moved.ok) {
      return;
    }

    const attacked = addAttack(moved.plan, state, attacker.id, target.id);

    expect(attacked.ok).toBe(true);

    if (!attacked.ok) {
      return;
    }

    const committed = commitPlan(state, attacked.plan);
    const movedUnit = committed.state.units.find((unit) => unit.id === attacker.id)!;
    const hitUnit = committed.state.units.find((unit) => unit.id === target.id)!;

    expect(movedUnit).toMatchObject({ pos: { col: 3, row: 3 }, movesLeft: 3, hasActed: true });
    expect(hitUnit.hp).toBe(5);
  });

  it('piechota nie ruszy się po ataku', () => {
    let state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 3, row: 3 }, 'red');
    const attacker = state.units[0]!;
    const attack = addAttack(
      createTurnPlan(createTurnState()),
      state,
      attacker.id,
      state.units[1]!.id,
    );

    expect(attack.ok).toBe(true);

    if (!attack.ok) {
      return;
    }

    expect(setMove(attack.plan, state, attacker.id, { col: 2, row: 4 })).toEqual({
      ok: false,
      reason: 'unreachable',
    });
  });
});
