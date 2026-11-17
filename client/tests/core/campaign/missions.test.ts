import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from '../../../src/core/campaign/missions/ruch-jednostek';
import { commitPlan, createTurnPlan, setBoard, setMove } from '../../../src/core/plan';
import { recruitUnit } from '../../../src/core/scenario';
import { boardingPath, canCarry } from '../../../src/core/transport';
import { isUnitVisible } from '../../../src/core/vision';

describe('misje kampanii', () => {
  it('pierwsze kroki startuje bez niebieskich jednostek i jednym czerwonym ukrytym we mgle', () => {
    const mission = PIERWSZE_KROKI.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const blueUnits = mission.state.units.filter((unit) => unit.faction === 'blue');
    const redUnits = mission.state.units.filter((unit) => unit.faction === 'red');

    expect(PIERWSZE_KROKI.title).toBe('To był zwykły spacer na grzyby');
    expect(mission.autoDeploy).toBe(false);
    expect(blueUnits).toHaveLength(0);
    expect(redUnits).toHaveLength(1);
    expect(redUnits[0]?.kind).toBe('infantry');

    expect(mission.state.map.fogOfWar).toBe(true);
    expect(isUnitVisible(mission.state, redUnits[0]!, 'blue')).toBe(false);
    expect(
      isUnitVisible(mission.state, redUnits[0]!, 'blue', {
        pos: { col: 2, row: 5 },
        range: 3,
      }),
    ).toBe(false);
    expect(mission.spawn).toEqual({ col: 2, row: 5, vision: 3 });
    expect(mission.tutorial?.steps).toHaveLength(4);
  });

  it('ruch jednostek to poligon bez wroga z górami, bagnem i nagrodą', () => {
    const mission = RUCH_JEDNOSTEK.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const blueUnits = mission.state.units.filter((unit) => unit.faction === 'blue');
    const redUnits = mission.state.units.filter((unit) => unit.faction === 'red');
    const terrains = new Set(Object.values(mission.state.map.cells));
    const steps = mission.tutorial?.steps ?? [];
    const reward = steps[3]?.reward;

    expect(mission.autoDeploy).toBe(false);
    expect(mission.sandbox).toBe(true);
    expect(RUCH_JEDNOSTEK.requiresMission).toBe('tutorial-pierwsze-kroki');
    expect(mission.spawn).toEqual({ col: 2, row: 5, vision: 3 });
    expect(blueUnits.map((unit) => unit.kind).sort()).toEqual(['infantry', 'infantry', 'scout']);
    expect(redUnits).toHaveLength(0);
    expect(mission.recruitment?.funds).toBe(0);
    expect(mission.recruitment?.allowedKinds).toEqual([]);
    expect(steps).toHaveLength(10);
    expect(reward).toEqual({ funds: 300, allowedKinds: ['tank'] });
    expect(steps[4]?.until).toEqual({ purchased: 'tank', count: 1 });
    expect(steps[5]?.until).toEqual({ boarded: 1 });
    expect(steps[6]?.until).toEqual({ tankCol: 12 });
    expect(steps[6]?.spawn).toEqual([
      { kind: 'infantry', faction: 'red', col: 13, row: 5 },
      { kind: 'infantry', faction: 'red', col: 14, row: 6 },
    ]);
    expect(steps[7]?.until).toEqual({ survived: 1 });
    expect(steps[7]?.retireSpawn).toBe(6);
    expect(steps[8]?.until).toEqual({ returned: true });
    expect(steps[8]?.spawn).toEqual([
      { kind: 'bazooka', faction: 'red', col: 3, row: 5 },
    ]);
    expect(steps[9]?.until).toEqual({ bazookaHits: 1 });
    expect([...terrains]).toEqual(
      expect.arrayContaining(['plain', 'road', 'forest', 'swamp', 'water', 'mountain', 'city']),
    );
  });

  it('kupiony czołg staje w zasięgu piechura i przyjmuje pasażera', () => {
    const mission = RUCH_JEDNOSTEK.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const recruited = recruitUnit(mission.state, 'blue', 'tank', mission.spawn);
    const tank = recruited?.state.units.find((unit) => unit.kind === 'tank');
    const infantry = recruited?.state.units.find((unit) => unit.kind === 'infantry');

    expect(tank).toBeDefined();
    expect(infantry).toBeDefined();
    if (!recruited || !tank || !infantry) {
      return;
    }

    expect(canCarry(tank, infantry)).toBe(true);
    expect(boardingPath(recruited.state, infantry, tank)).toBeDefined();
  });

  it('piechur wsiada przed jazdą i czołg zabiera go na miejsce', () => {
    const mission = RUCH_JEDNOSTEK.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const recruited = recruitUnit(mission.state, 'blue', 'tank', mission.spawn);
    const tank = recruited?.state.units.find((unit) => unit.kind === 'tank');
    const infantry = recruited?.state.units.find((unit) => unit.kind === 'infantry');

    expect(recruited).toBeDefined();
    expect(tank).toBeDefined();
    expect(infantry).toBeDefined();
    if (!recruited || !tank || !infantry) {
      return;
    }

    const destination = { col: tank.pos.col + 2, row: tank.pos.row };
    const moved = setMove(
      createTurnPlan({ faction: 'blue', turn: 1 }),
      recruited.state,
      tank.id,
      destination,
    );

    expect(moved.ok).toBe(true);
    if (!moved.ok) {
      return;
    }

    const boarded = setBoard(moved.plan, recruited.state, infantry.id, tank.id);

    expect(boarded.ok).toBe(true);
    if (!boarded.ok) {
      return;
    }

    const committed = commitPlan(recruited.state, boarded.plan);
    const movedTank = committed.state.units.find((unit) => unit.id === tank.id);

    expect(movedTank?.pos).toEqual(destination);
    expect(movedTank?.cargo).toHaveLength(1);
    expect(movedTank?.cargo?.[0]?.id).toBe(infantry.id);
    expect(committed.state.units.some((unit) => unit.id === infantry.id)).toBe(false);
  });
});
