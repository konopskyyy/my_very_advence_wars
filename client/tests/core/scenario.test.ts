import { describe, expect, it } from 'vitest';
import { BUILT_IN_MAPS, cellKey } from '../../src/core/map';
import {
  BUILT_IN_SCENARIOS,
  findScenarioDefinition,
  SCENARIO_COLS,
  SCENARIO_ROWS,
} from '../../src/core/scenario';
import { TERRAIN_IDS } from '../../src/core/terrain';
import type { FactionId, UnitKind } from '../../src/core/units';

describe('scenariusze', () => {
  it('zawiera jeden scenariusz testowy', () => {
    expect(BUILT_IN_SCENARIOS).toHaveLength(1);
    expect(BUILT_IN_SCENARIOS[0]?.id).toBe('front-wschodni');
  });

  it('mapa jest 3–4 razy większa od największej mapy wbudowanej', () => {
    const scenario = BUILT_IN_SCENARIOS[0]!;
    const scenarioTiles = Object.keys(scenario.state.map.cells).length;
    const largestBuiltIn = Math.max(
      ...BUILT_IN_MAPS.map((definition) => Object.keys(definition.map.cells).length),
    );
    const ratio = scenarioTiles / largestBuiltIn;

    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThanOrEqual(4);
    expect(SCENARIO_COLS).toBe(48);
    expect(SCENARIO_ROWS).toBe(28);
  });

  it('używa wszystkich rodzajów terenu', () => {
    const scenario = BUILT_IN_SCENARIOS[0]!;
    const terrains = new Set(Object.values(scenario.state.map.cells));

    for (const terrain of TERRAIN_IDS) {
      expect(terrains.has(terrain), `brak terenu ${terrain}`).toBe(true);
    }
  });

  it('ma jednostki gracza i przeciwnika wszystkich rodzajów', () => {
    const scenario = BUILT_IN_SCENARIOS[0]!;

    for (const faction of ['blue', 'red'] as FactionId[]) {
      const units = scenario.state.units.filter((unit) => unit.faction === faction);
      const kinds = new Set<UnitKind>(units.map((unit) => unit.kind));

      expect(units.length).toBeGreaterThanOrEqual(5);
      expect(kinds.size).toBe(4);
    }
  });

  it('stawia każdą jednostkę na istniejącym kaflu', () => {
    const scenario = BUILT_IN_SCENARIOS[0]!;

    for (const unit of scenario.state.units) {
      expect(
        scenario.state.map.cells[cellKey(unit.pos)],
        `brak kafla pod jednostką ${unit.id}`,
      ).toBeDefined();
    }
  });

  it('znajduje scenariusz po identyfikatorze', () => {
    expect(findScenarioDefinition('front-wschodni')?.name).toBe('Front Wschodni');
    expect(findScenarioDefinition('nie-ma-takiego')).toBeUndefined();
  });
});
