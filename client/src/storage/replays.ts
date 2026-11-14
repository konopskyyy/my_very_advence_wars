import type { Database } from 'sql.js';
import { commitPlan, type TurnLog, type TurnPlan } from '../core/plan';
import type { GameState } from '../core/state';
import { beginTurn } from '../core/turn';
import type { FactionId } from '../core/units';
import { openDatabase, persistDatabase } from '../integrations/sqlite';
import { deserializeGameState, serializeGameState } from './mapSerialization';
import { deserializeTurnPlan, serializeTurnPlan } from './planSerialization';

export const REPLAYS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS replays (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    scenario_name TEXT NOT NULL DEFAULT '',
    player_faction TEXT NOT NULL,
    initial_state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS turn_plans (
    replay_id TEXT NOT NULL,
    turn INTEGER NOT NULL,
    faction TEXT NOT NULL,
    plan TEXT NOT NULL,
    state_after TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (replay_id, turn)
  );

  CREATE TABLE IF NOT EXISTS turn_logs (
    replay_id TEXT NOT NULL,
    turn INTEGER NOT NULL,
    faction TEXT NOT NULL,
    log TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (replay_id, turn)
  );
`;

export interface StartReplayInput {
  readonly id: string;
  readonly scenarioId: string;
  readonly scenarioName: string;
  readonly playerFaction: FactionId;
  readonly state: GameState;
}

export interface ReplaySummary {
  readonly id: string;
  readonly scenarioId: string;
  readonly scenarioName: string;
  readonly playerFaction: FactionId;
  readonly turns: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoredTurnPlan {
  readonly turn: number;
  readonly faction: FactionId;
  readonly plan: TurnPlan;
  readonly stateAfter: GameState;
  readonly log?: TurnLog;
}

export interface StoredReplay extends ReplaySummary {
  readonly initialState: GameState;
  readonly plans: readonly StoredTurnPlan[];
  readonly truncated: boolean;
}

export function ensureReplaysSchema(db: Database): void {
  db.run(REPLAYS_SCHEMA);
}

export function createReplay(
  db: Database,
  input: StartReplayInput,
  createdAt = new Date().toISOString(),
): void {
  db.run(
    `INSERT INTO replays (id, scenario_id, scenario_name, player_faction, initial_state, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [
      input.id,
      input.scenarioId,
      input.scenarioName,
      input.playerFaction,
      serializeGameState(input.state),
      createdAt,
      createdAt,
    ],
  );
}

export function appendTurnPlan(
  db: Database,
  replayId: string,
  plan: TurnPlan,
  stateAfter: GameState,
  createdAt = new Date().toISOString(),
): void {
  db.run(
    `INSERT INTO turn_plans (replay_id, turn, faction, plan, state_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(replay_id, turn) DO UPDATE SET
       faction = excluded.faction,
       plan = excluded.plan,
       state_after = excluded.state_after,
       created_at = excluded.created_at`,
    [
      replayId,
      plan.turn,
      plan.faction,
      serializeTurnPlan(plan),
      serializeGameState(stateAfter),
      createdAt,
    ],
  );
  db.run('UPDATE replays SET updated_at = ? WHERE id = ?', [createdAt, replayId]);
}

export function appendTurnLog(
  db: Database,
  replayId: string,
  log: TurnLog,
  createdAt = new Date().toISOString(),
): void {
  db.run(
    `INSERT INTO turn_logs (replay_id, turn, faction, log, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(replay_id, turn) DO UPDATE SET
       faction = excluded.faction,
       log = excluded.log,
       created_at = excluded.created_at`,
    [replayId, log.turn, log.faction, JSON.stringify(log), createdAt],
  );
  db.run('UPDATE replays SET updated_at = ? WHERE id = ?', [createdAt, replayId]);
}

function deserializeTurnLog(raw: string): TurnLog {
  const value: unknown = JSON.parse(raw);

  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as TurnLog).turn !== 'number' ||
    typeof (value as TurnLog).damageTotal !== 'number' ||
    !Array.isArray((value as TurnLog).moves) ||
    !Array.isArray((value as TurnLog).attacks)
  ) {
    throw new Error('Nieprawidłowy dziennik tury');
  }

  return value as TurnLog;
}

export function listReplays(db: Database): ReplaySummary[] {
  const statement = db.prepare(
    `SELECT r.id, r.scenario_id, r.scenario_name, r.player_faction, r.created_at, r.updated_at,
            COUNT(p.turn) AS turns
     FROM replays r
     LEFT JOIN turn_plans p ON p.replay_id = r.id
     GROUP BY r.id
     ORDER BY r.updated_at DESC, r.id ASC`,
  );
  const replays: ReplaySummary[] = [];

  try {
    while (statement.step()) {
      const row = statement.getAsObject();

      replays.push({
        id: String(row.id),
        scenarioId: String(row.scenario_id),
        scenarioName: String(row.scenario_name),
        playerFaction: String(row.player_faction) as FactionId,
        turns: Number(row.turns),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      });
    }
  } finally {
    statement.free();
  }

  return replays;
}

export function readReplay(db: Database, id: string): StoredReplay | undefined {
  const statement = db.prepare(
    `SELECT id, scenario_id, scenario_name, player_faction, initial_state, created_at, updated_at
     FROM replays
     WHERE id = ?`,
  );

  let header: Record<string, unknown> | undefined;

  try {
    statement.bind([id]);

    if (statement.step()) {
      header = statement.getAsObject();
    }
  } finally {
    statement.free();
  }

  if (!header) {
    return undefined;
  }

  const plans: StoredTurnPlan[] = [];
  let truncated = false;
  const planStatement = db.prepare(
    `SELECT turn, faction, plan, state_after
     FROM turn_plans
     WHERE replay_id = ?
     ORDER BY turn ASC`,
  );

  try {
    planStatement.bind([id]);

    while (planStatement.step()) {
      const row = planStatement.getAsObject();

      try {
        plans.push({
          turn: Number(row.turn),
          faction: String(row.faction) as FactionId,
          plan: deserializeTurnPlan(String(row.plan)),
          stateAfter: deserializeGameState(String(row.state_after)),
        });
      } catch {
        truncated = true;
        break;
      }
    }
  } finally {
    planStatement.free();
  }

  const logs = new Map<number, TurnLog>();
  const logStatement = db.prepare(
    `SELECT turn, log
     FROM turn_logs
     WHERE replay_id = ?
     ORDER BY turn ASC`,
  );

  try {
    logStatement.bind([id]);

    while (logStatement.step()) {
      const row = logStatement.getAsObject();

      try {
        logs.set(Number(row.turn), deserializeTurnLog(String(row.log)));
      } catch {
        truncated = true;
        break;
      }
    }
  } finally {
    logStatement.free();
  }

  return {
    id: String(header.id),
    scenarioId: String(header.scenario_id),
    scenarioName: String(header.scenario_name),
    playerFaction: String(header.player_faction) as FactionId,
    turns: plans.length,
    createdAt: String(header.created_at),
    updatedAt: String(header.updated_at),
    initialState: deserializeGameState(String(header.initial_state)),
    plans: plans.map((entry) => {
      const log = logs.get(entry.turn);

      return log ? { ...entry, log } : entry;
    }),
    truncated,
  };
}

export function deleteReplaysForScenario(db: Database, scenarioId: string): number {
  const countStatement = db.prepare('SELECT COUNT(*) AS count FROM replays WHERE scenario_id = ?');
  let count = 0;

  try {
    countStatement.bind([scenarioId]);

    if (countStatement.step()) {
      count = Number(countStatement.getAsObject().count);
    }
  } finally {
    countStatement.free();
  }

  db.run(
    `DELETE FROM turn_plans
     WHERE replay_id IN (SELECT id FROM replays WHERE scenario_id = ?)`,
    [scenarioId],
  );
  db.run(
    `DELETE FROM turn_logs
     WHERE replay_id IN (SELECT id FROM replays WHERE scenario_id = ?)`,
    [scenarioId],
  );
  db.run('DELETE FROM replays WHERE scenario_id = ?', [scenarioId]);

  return count;
}

export function replayStates(replay: StoredReplay): GameState[] {
  const states: GameState[] = [];
  let state = replay.initialState;

  for (const entry of replay.plans) {
    state = beginTurn(state, entry.faction);
    state = commitPlan(state, entry.plan).state;
    states.push(state);
  }

  return states;
}

export function createReplayId(now = Date.now()): string {
  return `replay-${now.toString(36)}`;
}

export async function startReplay(input: StartReplayInput): Promise<void> {
  const db = await openReplayDatabase();

  createReplay(db, input);
  persistDatabase(db);
}

export async function recordTurnPlan(
  replayId: string,
  plan: TurnPlan,
  stateAfter: GameState,
  log?: TurnLog,
  createdAt?: string,
): Promise<void> {
  const db = await openReplayDatabase();

  appendTurnPlan(db, replayId, plan, stateAfter, createdAt);

  if (log) {
    appendTurnLog(db, replayId, log, createdAt);
  }

  persistDatabase(db);
}

export async function loadReplay(id: string): Promise<StoredReplay | undefined> {
  const db = await openReplayDatabase();

  try {
    return readReplay(db, id);
  } catch {
    return undefined;
  }
}

export async function listStoredReplays(): Promise<ReplaySummary[]> {
  return listReplays(await openReplayDatabase());
}

export async function removeScenarioReplays(scenarioId: string): Promise<number> {
  const db = await openReplayDatabase();
  const removed = deleteReplaysForScenario(db, scenarioId);

  if (removed > 0) {
    persistDatabase(db);
  }

  return removed;
}

async function openReplayDatabase(): Promise<Database> {
  const db = await openDatabase();

  ensureReplaysSchema(db);

  return db;
}
