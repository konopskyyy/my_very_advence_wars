import { describe, expect, it } from 'vitest';
import { createMap, hexDistance, type HexCoord } from '../../../src/core/map';
import { createTurnPlan, planningState, unitActions } from '../../../src/core/plan';
import { createInitialState, placeUnit, type GameState } from '../../../src/core/state';
import { createTurnState } from '../../../src/core/turn';
import { EngageOrAdvanceRule } from '../../../src/si/rules/engageOrAdvance';
import type { SiContext } from '../../../src/si/types';

function contextFor(state: GameState, unitId: string, spawn: HexCoord): SiContext {
  const unit = state.units.find((candidate) => candidate.id === unitId);

  if (!unit) {
    throw new Error(`Brak jednostki ${unitId}`);
  }

  return {
    state,
    plan: createTurnPlan(createTurnState(unit.faction)),
    unit,
    spawn,
  };
}

describe('EngageOrAdvanceRule', () => {
  it('atakuje wroga w zasięgu bez ruchu', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 7, row: 5 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 5, row: 5 }, 'red');
    const context = contextFor(state, 'u2', { col: 5, row: 5 });
    const rule = new EngageOrAdvanceRule();

    expect(rule.canBeUsed(context)).toBe(true);

    const plan = rule.perform(context);

    expect(unitActions(plan, 'u2').map((action) => action.kind)).toEqual(['attack']);
  });

  it('podchodzi i atakuje wroga widocznego poza zasięgiem', () => {
    let state = createInitialState(createMap(12, 12));
    state = placeUnit(state, 'infantry', { col: 7, row: 5 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 3, row: 5 }, 'red');
    const context = contextFor(state, 'u2', { col: 3, row: 5 });
    const rule = new EngageOrAdvanceRule();

    const plan = rule.perform(context);
    const planned = planningState(state, plan).units.find((unit) => unit.id === 'u2');
    const distance = planned ? hexDistance(planned.pos, { col: 7, row: 5 }) : 0;

    expect(unitActions(plan, 'u2').map((action) => action.kind)).toEqual(['move', 'attack']);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThanOrEqual(2);
  });

  it('bez widocznego wroga idzie od miejsca pojawienia się', () => {
    let state = createInitialState(createMap(12, 12));
    state = placeUnit(state, 'infantry', { col: 8, row: 5 }, 'red');
    const spawn = { col: 9, row: 5 };
    const context = contextFor(state, 'u1', spawn);
    const rule = new EngageOrAdvanceRule();

    const plan = rule.perform(context);
    const planned = planningState(state, plan).units.find((unit) => unit.id === 'u1');
    const distance = planned ? hexDistance(planned.pos, spawn) : 0;

    expect(unitActions(plan, 'u1').map((action) => action.kind)).toEqual(['move']);
    expect(distance).toBeGreaterThan(1);
  });

  it('nie może działać po wykonaniu akcji', () => {
    let state = createInitialState(createMap(10, 10));
    state = placeUnit(state, 'infantry', { col: 7, row: 5 }, 'blue');
    state = placeUnit(state, 'infantry', { col: 5, row: 5 }, 'red');
    state = {
      ...state,
      units: state.units.map((unit) =>
        unit.id === 'u2' ? { ...unit, hasActed: true } : unit,
      ),
    };

    expect(new EngageOrAdvanceRule().canBeUsed(contextFor(state, 'u2', { col: 5, row: 5 }))).toBe(
      false,
    );
  });
});
