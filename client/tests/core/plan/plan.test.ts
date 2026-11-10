import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import {
  addAttack,
  createTurnPlan,
  planningState,
  removeLastAction,
  setMove,
  unitActions,
} from '../../../src/core/plan';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { createTurnState } from '../../../src/core/turn';

function blueInfantryAt(state: ReturnType<typeof createInitialState>, col: number, row: number) {
  return placeUnit(state, 'infantry', { col, row }, 'blue');
}

describe('plan', () => {
  it('ustawia trasę w budżecie ruchu i pokazuje stan symulowany', () => {
    const state = blueInfantryAt(createInitialState(createMap(10, 10)), 2, 3);
    const unit = state.units[0]!;
    const result = setMove(createTurnPlan(createTurnState()), state, unit.id, { col: 4, row: 3 });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(unitActions(result.plan, unit.id)).toHaveLength(1);
    const planned = planningState(state, result.plan).units[0]!;

    expect(planned.pos).toEqual({ col: 4, row: 3 });
    expect(planned.movesLeft).toBe(2);
    expect(state.units[0]!.pos).toEqual({ col: 2, row: 3 });
  });

  it('zamienia końcową trasę zamiast dokładać kolejny ruch', () => {
    const state = blueInfantryAt(createInitialState(createMap(10, 10)), 2, 3);
    const unit = state.units[0]!;
    const first = setMove(createTurnPlan(createTurnState()), state, unit.id, { col: 3, row: 3 });

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = setMove(first.plan, state, unit.id, { col: 5, row: 3 });

    expect(second.ok).toBe(true);

    if (!second.ok) {
      return;
    }

    expect(unitActions(second.plan, unit.id)).toHaveLength(1);
    expect(planningState(state, second.plan).units[0]!.pos).toEqual({ col: 5, row: 3 });
  });

  it('dodaje atak i blokuje kolejny dla piechoty', () => {
    let state = blueInfantryAt(createInitialState(createMap(10, 10)), 2, 3);
    state = placeUnit(state, 'infantry', { col: 3, row: 3 }, 'red');
    const attacker = state.units[0]!;
    const target = state.units[1]!;
    const first = addAttack(createTurnPlan(createTurnState()), state, attacker.id, target.id);

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    expect(unitActions(first.plan, attacker.id)).toEqual([{ kind: 'attack', targetId: target.id }]);
    expect(addAttack(first.plan, state, attacker.id, target.id)).toEqual({
      ok: false,
      reason: 'no-shots',
    });
  });

  it('pozwala artylerii strzelać serią i dalej się ruszyć', () => {
    let state = placeUnit(createInitialState(createMap(12, 12)), 'artillery', { col: 1, row: 1 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 8, row: 8 }, 'red');
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

    const planned = planningState(state, second.plan).units[0]!;

    expect(planned.movesLeft).toBeCloseTo(4 / 3);
    expect(setMove(second.plan, state, attacker.id, { col: 2, row: 1 }).ok).toBe(true);
  });

  it('odrzuca jednostkę spoza aktywnej strony', () => {
    let state = placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'red');
    state = placeUnit(state, 'infantry', { col: 3, row: 3 }, 'blue');
    const enemy = state.units[0]!;
    const target = state.units[1]!;

    expect(addAttack(createTurnPlan(createTurnState()), state, enemy.id, target.id)).toEqual({
      ok: false,
      reason: 'wrong-faction',
    });
  });

  it('nie pozwala dwóm jednostkom skończyć na tym samym heksie', () => {
    let state = blueInfantryAt(createInitialState(createMap(10, 10)), 2, 3);
    state = blueInfantryAt(state, 2, 5);
    const [first, second] = state.units;
    const plan = createTurnPlan(createTurnState());
    const moved = setMove(plan, state, first!.id, { col: 3, row: 4 });

    expect(moved.ok).toBe(true);

    if (!moved.ok) {
      return;
    }

    expect(setMove(moved.plan, state, second!.id, { col: 3, row: 4 })).toEqual({
      ok: false,
      reason: 'occupied-target',
    });
  });

  it('usuwa ostatnią akcję jednostki', () => {
    let state = blueInfantryAt(createInitialState(createMap(10, 10)), 2, 3);
    state = placeUnit(state, 'infantry', { col: 3, row: 3 }, 'red');
    const unit = state.units[0]!;
    const plan = createTurnPlan(createTurnState());
    const moved = setMove(plan, state, unit.id, { col: 4, row: 3 });

    expect(moved.ok).toBe(true);

    if (!moved.ok) {
      return;
    }

    const attacked = addAttack(moved.plan, state, unit.id, state.units[1]!.id);

    expect(attacked.ok).toBe(true);

    if (!attacked.ok) {
      return;
    }

    const removed = removeLastAction(attacked.plan, unit.id);

    expect(unitActions(removed, unit.id)).toHaveLength(1);
    expect(unitActions(removeLastAction(removed, unit.id), unit.id)).toHaveLength(0);
  });
});
