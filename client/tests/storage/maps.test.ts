import initSqlJs, { type Database } from 'sql.js';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createMap, setTerrain } from '../../src/core/map';
import { createInitialState, placeUnit } from '../../src/core/state';
import type { GameState } from '../../src/core/state';
import {
  createSavedMapId,
  ensureMapsSchema,
  listMaps,
  readMap,
  upsertMap,
} from '../../src/storage/maps';

let db: Database;

function sampleState(): GameState {
  let map = createMap(6, 4);

  map = setTerrain(map, { col: 2, row: 2 }, 'mountain');

  let state = createInitialState(map);

  state = placeUnit(state, 'tank', { col: 1, row: 1 }, 'blue');

  return state;
}

describe('magazyn map', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();

    db = new SQL.Database();
    ensureMapsSchema(db);
  });

  afterAll(() => {
    db.close();
  });

  it('zapisuje mapę i odczytuje jej stan', () => {
    const state = sampleState();

    upsertMap(db, { id: 'test-1', name: 'Test', description: 'Opis', state }, '2026-01-01T10:00:00.000Z');

    const summary = listMaps(db).find((map) => map.id === 'test-1');

    expect(summary).toMatchObject({
      name: 'Test',
      description: 'Opis',
      tiles: 24,
      units: 1,
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
    expect(readMap(db, 'test-1')?.state).toEqual(state);
  });

  it('aktualizuje istniejący wpis zamiast dublować', () => {
    const state = sampleState();

    upsertMap(db, { id: 'test-1', name: 'Nowa nazwa', description: '', state }, '2026-01-02T10:00:00.000Z');

    const entries = listMaps(db).filter((map) => map.id === 'test-1');

    expect(entries).toHaveLength(1);
    expect(entries[0]?.name).toBe('Nowa nazwa');
    expect(entries[0]?.updatedAt).toBe('2026-01-02T10:00:00.000Z');
  });

  it('zwraca undefined dla brakującej mapy', () => {
    expect(readMap(db, 'brak')).toBeUndefined();
  });

  it('tworzy unikalne identyfikatory lokalne', () => {
    expect(createSavedMapId(1000)).toBe('local-rs');
    expect(createSavedMapId(2000)).toBe('local-1jk');
  });
});
