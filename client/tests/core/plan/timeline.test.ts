import { describe, expect, it } from 'vitest';
import { createMap } from '../../../src/core/map';
import {
  addAttack,
  buildTimeline,
  createTurnPlan,
  sampleTimeline,
  setMove,
} from '../../../src/core/plan';
import { createInitialState, placeUnit } from '../../../src/core/state';
import { createTurnState } from '../../../src/core/turn';

function planForTwoUnits() {
  let state = placeUnit(createInitialState(createMap(12, 12)), 'infantry', { col: 2, row: 3 }, 'blue');
  state = placeUnit(state, 'artillery', { col: 5, row: 5 }, 'blue');
  state = placeUnit(state, 'infantry', { col: 0, row: 5 }, 'red');
  const [, artillery] = state.units;
  const target = state.units[2]!;
  let plan = createTurnPlan(createTurnState());
  const infantryMove = setMove(plan, state, state.units[0]!.id, { col: 4, row: 3 });

  expect(infantryMove.ok).toBe(true);

  if (!infantryMove.ok) {
    throw new Error('infantry move');
  }

  plan = infantryMove.plan;
  const artilleryMove = setMove(plan, state, artillery!.id, { col: 6, row: 5 });

  expect(artilleryMove.ok).toBe(true);

  if (!artilleryMove.ok) {
    throw new Error('artillery move');
  }

  const attack = addAttack(artilleryMove.plan, state, artillery!.id, target.id);

  expect(attack.ok).toBe(true);

  if (!attack.ok) {
    throw new Error('artillery attack');
  }

  return { state, plan: attack.plan };
}

describe('timeline', () => {
  it('wyrównuje koniec akcji do długości tury', () => {
    const { state, plan } = planForTwoUnits();
    const timeline = buildTimeline(plan, state);

    expect(timeline.durationMs).toBe(950);

    const lastByUnit = new Map<string, number>();

    for (const clip of timeline.clips) {
      lastByUnit.set(clip.unitId, Math.max(lastByUnit.get(clip.unitId) ?? 0, clip.endMs));
    }

    for (const endMs of lastByUnit.values()) {
      expect(endMs).toBe(950);
    }

    expect(timeline.clips[0]).toMatchObject({ unitId: state.units[0]!.id, startMs: 450 });
    expect(timeline.clips[1]).toMatchObject({ unitId: state.units[1]!.id, startMs: 0, endMs: 250 });
    expect(timeline.clips[2]).toMatchObject({ unitId: state.units[1]!.id, startMs: 250, endMs: 950 });
  });

  it('próbkuje ruch w połowie kroku i strzał na końcu', () => {
    const { state, plan } = planForTwoUnits();
    const timeline = buildTimeline(plan, state);
    const frame = sampleTimeline(timeline, state, 800);
    const infantry = frame.units.find((unit) => unit.unitId === state.units[0]!.id)!;
    const artillery = frame.units.find((unit) => unit.unitId === state.units[1]!.id)!;

    expect(infantry.from).toEqual({ col: 3, row: 3 });
    expect(infantry.to).toEqual({ col: 4, row: 3 });
    expect(infantry.progress).toBeCloseTo(0.4);
    expect(artillery.from).toEqual({ col: 6, row: 5 });
    expect(artillery.to).toEqual({ col: 6, row: 5 });
    expect(frame.attacks).toHaveLength(1);
    expect(frame.attacks[0]!.targetId).toBe(state.units[2]!.id);
  });

  it('przed startem tury pokazuje pozycje startowe', () => {
    const { state, plan } = planForTwoUnits();
    const frame = sampleTimeline(buildTimeline(plan, state), state, 0);

    expect(frame.units.find((unit) => unit.unitId === state.units[0]!.id)).toMatchObject({
      from: { col: 2, row: 3 },
      to: { col: 2, row: 3 },
    });
    expect(frame.attacks).toHaveLength(0);
  });

  it('pusty plan ma zerowy czas i same bezruchowe klatki', () => {
    const state = placeUnit(createInitialState(createMap(8, 8)), 'scout', { col: 1, row: 1 }, 'blue');
    const timeline = buildTimeline(createTurnPlan(createTurnState()), state);
    const frame = sampleTimeline(timeline, state, 500);

    expect(timeline.durationMs).toBe(0);
    expect(frame.units[0]).toEqual({
      unitId: state.units[0]!.id,
      from: { col: 1, row: 1 },
      to: { col: 1, row: 1 },
      progress: 0,
    });
  });
});
