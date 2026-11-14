import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
import { RUCH_JEDNOSTEK } from '../../../src/core/campaign/missions/ruch-jednostek';
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

  it('ruch jednostek daje trzech graczy, jednego wroga i wyłącza rekrutację', () => {
    const mission = RUCH_JEDNOSTEK.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const blueUnits = mission.state.units.filter((unit) => unit.faction === 'blue');
    const redUnits = mission.state.units.filter((unit) => unit.faction === 'red');
    const terrains = new Set(Object.values(mission.state.map.cells));

    expect(mission.autoDeploy).toBe(false);
    expect(RUCH_JEDNOSTEK.requiresMission).toBe('tutorial-pierwsze-kroki');
    expect(mission.spawn).toEqual({ col: 2, row: 5, vision: 3 });
    expect(blueUnits.map((unit) => unit.kind).sort()).toEqual(['infantry', 'infantry', 'scout']);
    expect(redUnits).toHaveLength(1);
    expect(redUnits[0]?.kind).toBe('infantry');
    expect(mission.recruitment?.funds).toBe(0);
    expect(mission.recruitment?.allowedKinds).toEqual([]);
    expect(mission.tutorial?.steps).toHaveLength(4);
    expect([...terrains]).toEqual(expect.arrayContaining(['plain', 'road', 'forest', 'swamp', 'water']));
  });
});
