import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_MAPS,
  cellKey,
  clearMap,
  createMap,
  removeTerrain,
  setTerrain,
  terrainAt,
} from '../../src/core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  findScenarioDefinition,
  SCENARIO_COLS,
  SCENARIO_ROWS,
} from '../../src/core/scenario';
import { countUnits, createInitialState, deployUnits, placeUnit } from '../../src/core/state';
import { TERRAIN_DEFS, TERRAIN_IDS } from '../../src/core/terrain';
import type { TerrainId } from '../../src/core/terrain';
import type { FactionId, UnitKind } from '../../src/core/units';

const AUTO_KINDS: readonly UnitKind[] = [
  'infantry',
  'infantry',
  'infantry',
  'infantry',
  'tank',
  'tank',
  'artillery',
  'artillery',
  'scout',
  'scout',
];

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

  it('ma po 10 jednostek każdej strony w ustalonej kolejności rodzajów', () => {
    const scenario = BUILT_IN_SCENARIOS[0]!;

    for (const faction of ['blue', 'red'] as FactionId[]) {
      const units = scenario.state.units.filter((unit) => unit.faction === faction);

      expect(units).toHaveLength(10);
      expect(units.map((unit) => unit.kind)).toEqual(AUTO_KINDS);
      expect(units.filter((unit) => unit.kind === 'infantry')).toHaveLength(4);
      expect(units.filter((unit) => unit.kind === 'tank')).toHaveLength(2);
      expect(units.filter((unit) => unit.kind === 'artillery')).toHaveLength(2);
      expect(units.filter((unit) => unit.kind === 'scout')).toHaveLength(2);
    }
  });

  it('ma teren w miejscach malowanych prostokątami', () => {
    const map = BUILT_IN_SCENARIOS[0]!.state.map;
    const expected: ReadonlyArray<readonly [number, number, TerrainId]> = [
      [0, 0, 'mountain'],
      [3, 3, 'mountain'],
      [33, 0, 'mountain'],
      [36, 21, 'mountain'],
      [32, 24, 'mountain'],
      [1, 16, 'forest'],
      [11, 20, 'forest'],
      [35, 7, 'forest'],
      [14, 4, 'forest'],
      [27, 20, 'forest'],
      [22, 0, 'water'],
      [24, 6, 'water'],
      [22, 12, 'water'],
      [24, 17, 'water'],
      [22, 23, 'water'],
      [28, 2, 'water'],
      [10, 9, 'water'],
      [19, 8, 'swamp'],
      [26, 15, 'swamp'],
      [19, 18, 'swamp'],
      [15, 12, 'swamp'],
      [0, 13, 'road'],
      [47, 14, 'road'],
      [8, 0, 'road'],
      [9, 27, 'road'],
      [17, 5, 'road'],
      [33, 26, 'road'],
      [5, 12, 'city'],
      [41, 12, 'city'],
      [15, 3, 'city'],
      [30, 22, 'city'],
      [33, 8, 'city'],
      [12, 22, 'city'],
    ];

    for (const [col, row, terrain] of expected) {
      expect(terrainAt(map, { col, row }), `${col},${row}`).toBe(terrain);
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
    expect(findScenarioDefinition('front-wschodni')?.description).toContain('Niebieska strona');
    expect(findScenarioDefinition('nie-ma-takiego')).toBeUndefined();
  });
});

describe('ensureScenarioArmies', () => {
  it('uzupełnia obie strony na mapie bez jednostek', () => {
    const state = ensureScenarioArmies(createInitialState(createMap(12, 8)));
    const counts = countUnits(state.units);

    expect(counts).toEqual({ blue: 10, red: 10, total: 20 });

    for (const unit of state.units) {
      const terrain = state.map.cells[cellKey(unit.pos)];

      expect(terrain).toBeDefined();
      expect(TERRAIN_DEFS[terrain!].moveCost).toBeLessThan(99);
    }
  });

  it('zostawia wojsko istniejącej strony i dodaje tylko brakującą', () => {
    const map = createMap(12, 8);
    const withBlue = deployUnits(createInitialState(map), 'blue', [
      { kind: 'tank', col: 1, row: 1 },
    ]);
    const state = ensureScenarioArmies(withBlue);

    expect(state.units.filter((unit) => unit.faction === 'blue')).toHaveLength(1);
    expect(state.units.some((unit) => unit.faction === 'red')).toBe(true);
  });

  it('nie zmienia stanu, gdy obie strony mają wojsko', () => {
    const once = ensureScenarioArmies(createInitialState(createMap(12, 8)));

    expect(ensureScenarioArmies(once)).toBe(once);
  });

  it('nie dodaje wojska na pustej mapie', () => {
    const state = createInitialState(clearMap());

    expect(ensureScenarioArmies(state)).toBe(state);
  });

  it('rozkłada wojsko od lewej i prawej krawędzi mapy', () => {
    const state = ensureScenarioArmies(createInitialState(createMap(12, 8)));
    const blue = state.units.filter((unit) => unit.faction === 'blue');
    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(blue.map((unit) => unit.pos)).toEqual([
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: 2 },
      { col: 0, row: 3 },
      { col: 0, row: 4 },
      { col: 0, row: 5 },
      { col: 0, row: 6 },
      { col: 0, row: 7 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);
    expect(red.map((unit) => unit.pos)).toEqual([
      { col: 11, row: 0 },
      { col: 11, row: 1 },
      { col: 11, row: 2 },
      { col: 11, row: 3 },
      { col: 11, row: 4 },
      { col: 11, row: 5 },
      { col: 11, row: 6 },
      { col: 11, row: 7 },
      { col: 10, row: 0 },
      { col: 9, row: 0 },
    ]);
    expect(blue.map((unit) => unit.kind)).toEqual(AUTO_KINDS);
  });

  it('wypełnia wąską mapę kolejnymi kolumnami', () => {
    const state = ensureScenarioArmies(createInitialState(createMap(3, 1)));
    const blue = state.units.filter((unit) => unit.faction === 'blue');
    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(blue.map((unit) => unit.pos)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);
    expect(red).toHaveLength(0);
  });

  it('rozrzuca wojsko po wysokości mapy', () => {
    const state = ensureScenarioArmies(createInitialState(createMap(1, 12)));
    const blue = state.units.filter((unit) => unit.faction === 'blue');
    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(blue.map((unit) => unit.pos.row)).toEqual([0, 1, 2, 4, 5, 6, 7, 9, 10, 11]);
    expect(red.map((unit) => unit.pos.row)).toEqual([3, 8]);
  });

  it('kieruje czerwoną stronę od prawej krawędzi', () => {
    let state = placeUnit(createInitialState(createMap(4, 1)), 'infantry', { col: 0, row: 0 }, 'blue');
    state = ensureScenarioArmies(state);

    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(red.map((unit) => unit.pos)).toEqual([
      { col: 3, row: 0 },
      { col: 2, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(state.units.filter((unit) => unit.faction === 'blue')).toHaveLength(1);
  });

  it('pomija wodę przy rozmieszczeniu', () => {
    let map = createMap(4, 3);

    for (let row = 0; row < 3; row += 1) {
      map = setTerrain(map, { col: 0, row }, 'water');
    }

    const state = ensureScenarioArmies(createInitialState(map));
    const blue = state.units.filter((unit) => unit.faction === 'blue');

    expect(blue.map((unit) => unit.pos)).toEqual([
      { col: 1, row: 0 },
      { col: 1, row: 1 },
      { col: 1, row: 2 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
    ]);
  });

  it('pomija brakujące kafle', () => {
    const map = removeTerrain(createMap(4, 3), { col: 0, row: 1 });
    const state = ensureScenarioArmies(createInitialState(map));
    const blue = state.units.filter((unit) => unit.faction === 'blue');

    expect(blue).toHaveLength(10);
    expect(blue.some((unit) => unit.pos.col === 0 && unit.pos.row === 1)).toBe(false);
  });

  it('liczy wysokość od pierwszego istniejącego rzędu', () => {
    let map = createMap(1, 12);

    for (let row = 0; row < 5; row += 1) {
      map = removeTerrain(map, { col: 0, row });
    }

    const state = ensureScenarioArmies(createInitialState(map));
    const blue = state.units.filter((unit) => unit.faction === 'blue');
    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(blue.map((unit) => unit.pos.row)).toEqual([5, 6, 7, 8, 9, 10, 11]);
    expect(red).toHaveLength(0);
  });

  it('nie nadpisuje jednostek stojących na heksach rozmieszczenia', () => {
    let state = createInitialState(createMap(3, 3));

    for (let row = 0; row < 3; row += 1) {
      state = placeUnit(state, 'tank', { col: 2, row }, 'blue');
    }

    state = ensureScenarioArmies(state);

    const blue = state.units.filter((unit) => unit.faction === 'blue');
    const red = state.units.filter((unit) => unit.faction === 'red');

    expect(blue).toHaveLength(3);
    expect(blue.every((unit) => unit.kind === 'tank')).toBe(true);
    expect(red.map((unit) => unit.pos)).toEqual([
      { col: 1, row: 0 },
      { col: 1, row: 1 },
      { col: 1, row: 2 },
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: 2 },
    ]);
    expect(new Set(state.units.map((unit) => cellKey(unit.pos))).size).toBe(state.units.length);
  });
});
