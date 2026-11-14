import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import { buildTurnLog, commitPlan, type TurnPlan } from '../../../src/core/plan';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { beginTurn } from '../../../src/core/turn';

function battle() {
  let state = createInitialState(createMap(8, 6));

  state = placeUnit(state, 'infantry', { col: 1, row: 1 }, 'blue');
  state = placeUnit(state, 'infantry', { col: 3, row: 1 }, 'red');

  return beginTurn(state, 'blue');
}

describe('dziennik tury', () => {
  it('zapisuje ruch, atak i sumę obrażeń z commitPlan', () => {
    const state = battle();
    const attacker = state.units.find((unit) => unit.faction === 'blue')!;
    const target = state.units.find((unit) => unit.faction === 'red')!;
    const plan: TurnPlan = {
      faction: 'blue',
      turn: 1,
      units: [
        {
          unitId: attacker.id,
          actions: [
            { kind: 'move', path: [{ col: 2, row: 1 }] },
            { kind: 'attack', targetId: target.id },
          ],
        },
      ],
    };
    const committed = commitPlan(state, plan);
    const log = buildTurnLog(plan, state, committed);

    expect(log.turn).toBe(1);
    expect(log.faction).toBe('blue');
    expect(log.moves).toEqual([
      {
        unitId: attacker.id,
        kind: 'infantry',
        from: { col: 1, row: 1 },
        to: { col: 2, row: 1 },
      },
    ]);
    expect(log.attacks).toHaveLength(1);
    expect(log.attacks[0]).toMatchObject({
      unitId: attacker.id,
      unitKind: 'infantry',
      targetId: target.id,
      targetKind: 'infantry',
      damage: committed.hits[0]?.damage,
      killed: false,
    });
    expect(log.damageTotal).toBe(committed.hits.reduce((total, hit) => total + hit.damage, 0));
  });

  it('oznacza zabitego celu bez zmiany sumy obrażeń', () => {
    const state = battle();
    const attacker = state.units.find((unit) => unit.faction === 'blue')!;
    const target = state.units.find((unit) => unit.faction === 'red')!;
    const weakened = {
      ...state,
      units: state.units.map((unit) => (unit.id === target.id ? { ...unit, hp: 1 } : unit)),
    };
    const plan: TurnPlan = {
      faction: 'blue',
      turn: 1,
      units: [
        {
          unitId: attacker.id,
          actions: [
            { kind: 'move', path: [{ col: 2, row: 1 }] },
            { kind: 'attack', targetId: target.id },
          ],
        },
      ],
    };
    const committed = commitPlan(weakened, plan);
    const log = buildTurnLog(plan, weakened, committed);

    expect(log.attacks[0]?.killed).toBe(true);
    expect(log.damageTotal).toBe(committed.hits[0]?.damage);
  });

  it('pusty plan daje pusty dziennik', () => {
    const state = battle();
    const plan: TurnPlan = { faction: 'blue', turn: 1, units: [] };

    expect(buildTurnLog(plan, state, commitPlan(state, plan))).toEqual({
      turn: 1,
      faction: 'blue',
      moves: [],
      attacks: [],
      damageTotal: 0,
    });
  });
});
