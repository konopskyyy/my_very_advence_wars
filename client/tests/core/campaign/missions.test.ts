import { describe, expect, it } from 'vitest';
import { PIERWSZE_KROKI } from '../../../src/core/campaign/missions/pierwsze-kroki';
import { isUnitVisible } from '../../../src/core/vision';

describe('misje kampanii', () => {
  it('pierwsze kroki ma trzy niebieskie piechoty i jednego czerwonego ukrytego we mgle', () => {
    const mission = PIERWSZE_KROKI.mission;

    expect(mission).toBeDefined();
    if (!mission) {
      return;
    }

    const blueUnits = mission.state.units.filter((unit) => unit.faction === 'blue');
    const redUnits = mission.state.units.filter((unit) => unit.faction === 'red');

    expect(blueUnits).toHaveLength(3);
    expect(blueUnits.every((unit) => unit.kind === 'infantry')).toBe(true);
    expect(redUnits).toHaveLength(1);
    expect(redUnits[0]?.kind).toBe('infantry');

    expect(mission.state.map.fogOfWar).toBe(true);
    expect(isUnitVisible(mission.state, redUnits[0]!, 'blue')).toBe(false);
  });
});
