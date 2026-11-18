import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import { attackIntent } from '../../../src/core/plan/attackIntent';
import { createTurnPlan } from '../../../src/core/plan/plan';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { createTurnState } from '../../../src/core/turn';

function scenario(redCol = 3, redRow = 3) {
  const state = placeUnit(
    placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue'),
    'infantry',
    { col: redCol, row: redRow },
    'red',
  );

  return { state, blue: state.units[0]!, red: state.units[1]! };
}

function plan() {
  return createTurnPlan(createTurnState());
}

describe('attackIntent', () => {
  it('wskazuje widocznego wroga w zasięgu jako cel ataku', () => {
    const { state, blue, red } = scenario();

    expect(attackIntent(plan(), state, blue, red)).toEqual({
      unitId: blue.id,
      targetId: red.id,
    });
  });

  it('nie wskazuje własnej jednostki ani wroga poza zasięgiem', () => {
    const nearby = scenario();
    const far = scenario(8, 8);

    expect(attackIntent(plan(), nearby.state, nearby.blue, nearby.blue)).toBeNull();
    expect(attackIntent(plan(), far.state, far.blue, far.red)).toBeNull();
  });

  it('nie wskazuje celu dla jednostki nieaktywnej strony', () => {
    const { state, blue, red } = scenario();

    expect(attackIntent(plan(), state, red, blue)).toBeNull();
  });
});
