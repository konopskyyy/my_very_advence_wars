import initSqlJs, { type Database } from 'sql.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMap } from '../../src/core/map';
import { commitPlan, type TurnPlan } from '../../src/core/plan';
import { createInitialState, placeUnit, type GameState } from '../../src/core/state';
import { beginTurn } from '../../src/core/turn';
import {
  appendTurnPlan,
  createReplay,
  createReplayId,
  deleteReplaysForScenario,
  ensureReplaysSchema,
  listReplays,
  readReplay,
  replayStates,
} from '../../src/storage/replays';

let db: Database;

function battle(): GameState {
  let state = createInitialState(createMap(8, 6));

  state = placeUnit(state, 'infantry', { col: 2, row: 2 }, 'blue');
  state = placeUnit(state, 'infantry', { col: 2, row: 3 }, 'red');

  return beginTurn(state, 'blue');
}

function turnPlan(state: GameState, faction: 'blue' | 'red', turn: number): TurnPlan {
  const attacker = state.units.find((unit) => unit.faction === faction)!;
  const target = state.units.find((unit) => unit.faction !== faction)!;

  return {
    faction,
    turn,
    units: [{ unitId: attacker.id, actions: [{ kind: 'attack', targetId: target.id }] }],
  };
}

describe('magazyn replayów', () => {
  beforeAll(async () => {
    const SQL = await initSqlJs();

    db = new SQL.Database();
    ensureReplaysSchema(db);
  });

  afterAll(() => {
    db.close();
  });

  it('zapisuje replay i dopisuje plany tur', () => {
    const state = battle();
    const plan1 = turnPlan(state, 'blue', 1);
    const after1 = commitPlan(state, plan1).state;
    const plan2 = turnPlan(after1, 'red', 2);
    const after2 = commitPlan(beginTurn(after1, 'red'), plan2).state;

    createReplay(
      db,
      {
        id: 'replay-front',
        scenarioId: 'front-wschodni',
        scenarioName: 'Front wschodni',
        playerFaction: 'blue',
        state,
      },
      '2026-01-01T10:00:00.000Z',
    );
    appendTurnPlan(db, 'replay-front', plan1, after1, '2026-01-01T10:05:00.000Z');
    appendTurnPlan(db, 'replay-front', plan2, after2, '2026-01-01T10:10:00.000Z');

    const replay = readReplay(db, 'replay-front');

    expect(replay).toMatchObject({
      scenarioId: 'front-wschodni',
      scenarioName: 'Front wschodni',
      playerFaction: 'blue',
      turns: 2,
      truncated: false,
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:10:00.000Z',
    });
    expect(replay?.initialState).toEqual(state);
    expect(replay?.plans.map((entry) => entry.turn)).toEqual([1, 2]);
    expect(replay?.plans[1]?.plan).toEqual(plan2);
  });

  it('odtwarza stan z initial_state i kolejnych planów', () => {
    const state = battle();
    const plan1 = turnPlan(state, 'blue', 1);
    const after1 = commitPlan(state, plan1).state;
    const plan2 = turnPlan(after1, 'red', 2);
    const after2 = commitPlan(beginTurn(after1, 'red'), plan2).state;

    createReplay(db, {
      id: 'replay-odtwarzanie',
      scenarioId: 'front-wschodni',
      scenarioName: 'Front wschodni',
      playerFaction: 'blue',
      state,
    });
    appendTurnPlan(db, 'replay-odtwarzanie', plan1, after1);
    appendTurnPlan(db, 'replay-odtwarzanie', plan2, after2);

    const replay = readReplay(db, 'replay-odtwarzanie');
    const states = replay ? replayStates(replay) : [];

    expect(states).toHaveLength(2);
    expect(states[0]).toEqual(after1);
    expect(states[1]).toEqual(after2);
    expect(states[1]).toEqual(replay?.plans[1]?.stateAfter);
  });

  it('podsumowuje replaye z liczbą tur', () => {
    const summary = listReplays(db).find((replay) => replay.id === 'replay-front');

    expect(summary).toMatchObject({
      scenarioId: 'front-wschodni',
      turns: 2,
      updatedAt: '2026-01-01T10:10:00.000Z',
    });
  });

  it('przerywa odczyt uszkodzonego planu bez wywracania rekordu', () => {
    const state = battle();
    const plan = turnPlan(state, 'blue', 1);

    createReplay(db, {
      id: 'replay-uszkodzony',
      scenarioId: 'front-wschodni',
      scenarioName: 'Front wschodni',
      playerFaction: 'blue',
      state,
    });
    appendTurnPlan(db, 'replay-uszkodzony', plan, commitPlan(state, plan).state);
    db.run(`UPDATE turn_plans SET plan = '{"version": 99}' WHERE replay_id = 'replay-uszkodzony'`);

    const replay = readReplay(db, 'replay-uszkodzony');

    expect(replay?.truncated).toBe(true);
    expect(replay?.plans).toHaveLength(0);
  });

  it('zgłasza błąd przy uszkodzonym stanie początkowym', () => {
    db.run(
      `INSERT INTO replays (id, scenario_id, scenario_name, player_faction, initial_state, created_at, updated_at)
       VALUES ('replay-zepsuty', 'front-wschodni', 'Front', 'blue', '{}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    );

    expect(() => readReplay(db, 'replay-zepsuty')).toThrow();
  });

  it('usuwa replaye i plany powiązane ze scenariuszem', () => {
    const state = battle();
    const plan = turnPlan(state, 'blue', 1);
    const after = commitPlan(state, plan).state;

    createReplay(db, {
      id: 'replay-do-usuniecia',
      scenarioId: 'usuwany',
      scenarioName: 'Usuwany',
      playerFaction: 'blue',
      state,
    });
    appendTurnPlan(db, 'replay-do-usuniecia', plan, after);

    expect(deleteReplaysForScenario(db, 'usuwany')).toBe(1);
    expect(readReplay(db, 'replay-do-usuniecia')).toBeUndefined();

    const statement = db.prepare(
      `SELECT COUNT(*) AS count FROM turn_plans WHERE replay_id = 'replay-do-usuniecia'`,
    );

    try {
      statement.step();
      expect(Number(statement.getAsObject().count)).toBe(0);
    } finally {
      statement.free();
    }
  });

  it('tworzy deterministyczne identyfikatory replayów', () => {
    expect(createReplayId(1000)).toBe('replay-rs');
    expect(createReplayId(2000)).toBe('replay-1jk');
  });
});
