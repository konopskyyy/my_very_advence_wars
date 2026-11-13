import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
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
});
