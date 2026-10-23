import type { Database } from 'sql.js';
import { mapTileCount } from '../core/map';
import type { GameState } from '../core/state';
import { openDatabase, persistDatabase } from './database';
import { deserializeGameState, serializeGameState } from './mapSerialization';

export interface SavedMapSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tiles: number;
  readonly units: number;
  readonly updatedAt: string;
}

export interface SavedMap extends SavedMapSummary {
  readonly state: GameState;
}

export interface SaveMapInput {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly state: GameState;
}

export const MAPS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL,
    tiles INTEGER NOT NULL,
    units INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

export function ensureMapsSchema(db: Database): void {
  db.run(MAPS_SCHEMA);
}

export function upsertMap(
  db: Database,
  input: SaveMapInput,
  updatedAt = new Date().toISOString(),
): void {
  db.run(
    `INSERT INTO maps (id, name, description, state, tiles, units, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       state = excluded.state,
       tiles = excluded.tiles,
       units = excluded.units,
       updated_at = excluded.updated_at`,
    [
      input.id,
      input.name,
      input.description,
      serializeGameState(input.state),
      mapTileCount(input.state.map),
      input.state.units.length,
      updatedAt,
      updatedAt,
    ],
  );
}

export function listMaps(db: Database): SavedMapSummary[] {
  const statement = db.prepare(
    `SELECT id, name, description, tiles, units, updated_at
     FROM maps
     ORDER BY updated_at DESC, name ASC`,
  );
  const maps: SavedMapSummary[] = [];

  try {
    while (statement.step()) {
      const row = statement.getAsObject();

      maps.push({
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        tiles: Number(row.tiles),
        units: Number(row.units),
        updatedAt: String(row.updated_at),
      });
    }
  } finally {
    statement.free();
  }

  return maps;
}

export function readMap(db: Database, id: string): SavedMap | undefined {
  const statement = db.prepare(
    `SELECT id, name, description, state, tiles, units, updated_at
     FROM maps
     WHERE id = ?`,
  );

  try {
    statement.bind([id]);

    if (!statement.step()) {
      return undefined;
    }

    const row = statement.getAsObject();

    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      state: deserializeGameState(String(row.state)),
      tiles: Number(row.tiles),
      units: Number(row.units),
      updatedAt: String(row.updated_at),
    };
  } finally {
    statement.free();
  }
}

export async function saveMap(input: SaveMapInput): Promise<void> {
  const db = await openMapDatabase();

  upsertMap(db, input);
  persistDatabase(db);
}

export async function listSavedMaps(): Promise<SavedMapSummary[]> {
  return listMaps(await openMapDatabase());
}

export async function loadSavedMap(id: string): Promise<SavedMap | undefined> {
  return readMap(await openMapDatabase(), id);
}

export function createSavedMapId(now = Date.now()): string {
  return `local-${now.toString(36)}`;
}

async function openMapDatabase(): Promise<Database> {
  const db = await openDatabase();

  ensureMapsSchema(db);

  return db;
}
