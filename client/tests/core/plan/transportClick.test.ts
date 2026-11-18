import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import { createTurnPlan } from '../../../src/core/plan/plan';
import { transportClick, transportIntent } from '../../../src/core/plan/transportClick';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { loadPassenger } from '../../../src/core/transport';
import { createTurnState } from '../../../src/core/turn';

function pair(): { state: ReturnType<typeof createInitialState>; infantryId: string; tankId: string } {
  const state = placeUnit(
    placeUnit(createInitialState(createMap(10, 10)), 'infantry', { col: 2, row: 3 }, 'blue'),
    'tank',
    { col: 4, row: 3 },
    'blue',
  );

  return { state, infantryId: state.units[0]!.id, tankId: state.units[1]!.id };
}

function plan() {
  return createTurnPlan(createTurnState());
}

describe('transportClick', () => {
  it('planuje wsiadanie prawym kliknięciem na czołg', () => {
    const { state, infantryId, tankId } = pair();
    const infantry = state.units.find((unit) => unit.id === infantryId)!;
    const tank = state.units.find((unit) => unit.id === tankId)!;
    const result = transportClick(plan(), state, infantry, tank.pos);

    expect(result?.ok).toBe(true);

    if (!result?.ok) {
      return;
    }

    expect(result.plan.units[0]).toMatchObject({
      unitId: infantryId,
      actions: [{ kind: 'board', targetId: tankId }],
    });
  });

  it('planuje wsiadanie także po zaznaczeniu czołgu i kliknięciu piechura', () => {
    const { state, infantryId, tankId } = pair();
    const infantry = state.units.find((unit) => unit.id === infantryId)!;
    const tank = state.units.find((unit) => unit.id === tankId)!;
    const result = transportClick(plan(), state, tank, infantry.pos);

    expect(result?.ok).toBe(true);

    if (!result?.ok) {
      return;
    }

    expect(result.plan.units[0]).toMatchObject({
      unitId: infantryId,
      actions: [{ kind: 'board', targetId: tankId }],
    });
  });

  it('planuje wysiadanie prawym kliknięciem na wolny heks obok czołgu', () => {
    const { state, infantryId, tankId } = pair();
    const loaded = loadPassenger(state, infantryId, tankId);
    const tank = loaded.units.find((unit) => unit.id === tankId)!;
    const result = transportClick(plan(), loaded, tank, { col: 5, row: 3 });

    expect(result?.ok).toBe(true);

    if (!result?.ok) {
      return;
    }

    expect(result.plan.units[0]).toMatchObject({
      unitId: tankId,
      actions: [{ kind: 'unload', passengerId: infantryId, target: { col: 5, row: 3 } }],
    });
  });

  it('nie planuje transportu kliknięciem w puste pole przy piechocie ani w wroga', () => {
    const { state, infantryId } = pair();
    const infantry = state.units.find((unit) => unit.id === infantryId)!;
    const enemyState = placeUnit(state, 'infantry', { col: 6, row: 3 }, 'red');
    const enemy = enemyState.units.find((unit) => unit.faction === 'red')!;

    expect(transportClick(plan(), state, infantry, { col: 3, row: 3 })).toBeNull();
    expect(transportClick(plan(), enemyState, infantry, enemy.pos)).toBeNull();
  });

  it('przekazuje odmowę, gdy czołg jest poza zasięgiem ruchu', () => {
    const state = placeUnit(
      placeUnit(createInitialState(createMap(14, 10)), 'infantry', { col: 0, row: 0 }, 'blue'),
      'tank',
      { col: 9, row: 0 },
      'blue',
    );
    const infantry = state.units[0]!;
    const tank = state.units[1]!;
    const result = transportClick(plan(), state, infantry, tank.pos);

    expect(result).toEqual({ ok: false, reason: 'unreachable' });
  });
});

describe('transportIntent', () => {
  it('wskazuje czołg jako cel ikony wsiadania w obie strony zaznaczenia', () => {
    const { state, infantryId, tankId } = pair();
    const infantry = state.units.find((unit) => unit.id === infantryId)!;
    const tank = state.units.find((unit) => unit.id === tankId)!;

    expect(transportIntent(plan(), state, infantry, tank.pos)).toEqual({
      kind: 'board',
      passengerId: infantryId,
      vehicleId: tankId,
      coord: tank.pos,
    });
    expect(transportIntent(plan(), state, tank, infantry.pos)).toEqual({
      kind: 'board',
      passengerId: infantryId,
      vehicleId: tankId,
      coord: infantry.pos,
    });
  });

  it('wskazuje wolny heks jako cel ikony wysiadania', () => {
    const { state, infantryId, tankId } = pair();
    const loaded = loadPassenger(state, infantryId, tankId);
    const tank = loaded.units.find((unit) => unit.id === tankId)!;

    expect(transportIntent(plan(), loaded, tank, { col: 5, row: 3 })).toEqual({
      kind: 'unload',
      passengerId: infantryId,
      vehicleId: tankId,
      coord: { col: 5, row: 3 },
      target: { col: 5, row: 3 },
    });
  });

  it('nie wskazuje celu poza heksem transportu', () => {
    const { state, infantryId } = pair();
    const infantry = state.units.find((unit) => unit.id === infantryId)!;

    expect(transportIntent(plan(), state, infantry, { col: 3, row: 3 })).toBeNull();
  });
});
