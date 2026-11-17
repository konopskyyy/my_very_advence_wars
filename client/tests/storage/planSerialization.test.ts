import { describe, expect, it } from 'vitest';
import type { TurnPlan } from '../../src/core/plan';
import {
  PLAN_FORMAT_VERSION,
  deserializeTurnPlan,
  serializeTurnPlan,
} from '../../src/storage/planSerialization';

const SAMPLE_PLAN: TurnPlan = {
  faction: 'blue',
  turn: 3,
  units: [
    {
      unitId: 'unit-1',
      actions: [
        { kind: 'move', path: [{ col: 2, row: 3 }, { col: 3, row: 3 }] },
        { kind: 'attack', targetId: 'unit-2' },
      ],
    },
  ],
};

describe('serializacja planu tury', () => {
  it('zapisuje i odczytuje plan bez zmian', () => {
    expect(deserializeTurnPlan(serializeTurnPlan(SAMPLE_PLAN))).toEqual(SAMPLE_PLAN);
  });

  it('umieszcza w formacie numer wersji', () => {
    const parsed = JSON.parse(serializeTurnPlan(SAMPLE_PLAN));

    expect(parsed.version).toBe(PLAN_FORMAT_VERSION);
    expect(parsed.faction).toBe('blue');
    expect(parsed.turn).toBe(3);
  });

  it('odrzuca nieobsługiwaną wersję formatu', () => {
    const json = JSON.stringify({ ...SAMPLE_PLAN, version: PLAN_FORMAT_VERSION + 1 });

    expect(() => deserializeTurnPlan(json)).toThrow(/wersja/i);
  });

  it('odrzuca dane, które nie są JSON-em', () => {
    expect(() => deserializeTurnPlan('{')).toThrow(/JSON/);
  });

  it('odrzuca nieprawidłową stronę i numer tury', () => {
    expect(() =>
      deserializeTurnPlan(JSON.stringify({ ...SAMPLE_PLAN, version: 1, faction: 'green' })),
    ).toThrow(/strona/i);
    expect(() =>
      deserializeTurnPlan(JSON.stringify({ ...SAMPLE_PLAN, version: 1, turn: 0 })),
    ).toThrow(/tur/i);
  });

  it('odrzuca akcję bez trasy i bez celu', () => {
    const emptyPath = {
      version: 1,
      faction: 'blue',
      turn: 1,
      units: [{ unitId: 'unit-1', actions: [{ kind: 'move', path: [] }] }],
    };
    const noTarget = {
      version: 1,
      faction: 'blue',
      turn: 1,
      units: [{ unitId: 'unit-1', actions: [{ kind: 'attack' }] }],
    };

    expect(() => deserializeTurnPlan(JSON.stringify(emptyPath))).toThrow(/trasa/i);
    expect(() => deserializeTurnPlan(JSON.stringify(noTarget))).toThrow(/cel/i);
  });

  it('odrzuca współrzędne spoza siatki liczb', () => {
    const badCoord = {
      version: 1,
      faction: 'blue',
      turn: 1,
      units: [{ unitId: 'unit-1', actions: [{ kind: 'move', path: [{ col: 'x', row: 1 }] }] }],
    };

    expect(() => deserializeTurnPlan(JSON.stringify(badCoord))).toThrow(/współrzędne/i);
  });

  it('zapisuje i odczytuje akcję wsiadania do pojazdu', () => {
    const plan: TurnPlan = {
      faction: 'blue',
      turn: 2,
      units: [
        {
          unitId: 'blue-1',
          actions: [
            { kind: 'board', targetId: 'blue-2', path: [{ col: 3, row: 3 }, { col: 4, row: 3 }] },
          ],
        },
      ],
    };

    expect(deserializeTurnPlan(serializeTurnPlan(plan))).toEqual(plan);
  });

  it('odrzuca wsiadanie bez pojazdu albo bez trasy', () => {
    const noTarget = {
      version: 1,
      faction: 'blue',
      turn: 1,
      units: [
        { unitId: 'unit-1', actions: [{ kind: 'board', path: [{ col: 1, row: 1 }] }] },
      ],
    };
    const noPath = {
      version: 1,
      faction: 'blue',
      turn: 1,
      units: [{ unitId: 'unit-1', actions: [{ kind: 'board', targetId: 'unit-2' }] }],
    };

    expect(() => deserializeTurnPlan(JSON.stringify(noTarget))).toThrow(/pojazdu/i);
    expect(() => deserializeTurnPlan(JSON.stringify(noPath))).toThrow(/wsiadania/i);
  });
});
