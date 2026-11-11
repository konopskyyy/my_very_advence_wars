import { describe, expect, it } from 'vitest';
import { createMap } from '../../src/core/map';
import { unitActions } from '../../src/core/plan';
import { createInitialState, placeUnit } from '../../src/core/state';
import { createTurnState } from '../../src/core/turn';
import { SI_RULES } from '../../src/si/rules';
import { buildSiPlan } from '../../src/si/turn';

describe('buildSiPlan', () => {
  it('planuje wszystkie jednostki aktywnej strony', () => {
    let state = createInitialState(createMap(12, 12));
    state = placeUnit(state, 'infantry', { col: 3, row: 5 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 8, row: 5 }, 'red');
    state = placeUnit(state, 'tank', { col: 8, row: 7 }, 'red');
    const spawns = new Map([
      ['u2', { col: 9, row: 5 }],
      ['u3', { col: 9, row: 7 }],
    ]);

    const plan = buildSiPlan(state, createTurnState('red'), spawns);

    expect(plan.faction).toBe('red');
    expect(plan.units.map((unit) => unit.unitId)).toEqual(['u2', 'u3']);
  });

  it('pomija jednostki drugiej strony', () => {
    let state = createInitialState(createMap(12, 12));
    state = placeUnit(state, 'infantry', { col: 3, row: 5 }, 'blue');
    const plan = buildSiPlan(state, createTurnState('red'), new Map());

    expect(plan.units).toEqual([]);
  });

  it('bez pozycji startowej używa bieżącego heksu', () => {
    let state = createInitialState(createMap(12, 12));
    state = placeUnit(state, 'infantry', { col: 5, row: 5 }, 'red');
    const plan = buildSiPlan(state, createTurnState('red'), new Map());

    expect(unitActions(plan, 'u1').length).toBeGreaterThan(0);
  });

  it('lista reguł jest posortowana malejąco po priorytecie', () => {
    const priorities = SI_RULES.map((rule) => rule.priority);

    expect(priorities).toEqual([...priorities].sort((left, right) => right - left));
  });
});
