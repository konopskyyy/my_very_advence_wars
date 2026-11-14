import type { HexCoord } from '../core/map';
import type { PlanAction, TurnPlan, UnitPlan } from '../core/plan';
import { FACTION_IDS, type FactionId } from '../core/units';

export const PLAN_FORMAT_VERSION = 1;

const FACTION_SET = new Set<string>(FACTION_IDS);

export function serializeTurnPlan(plan: TurnPlan): string {
  return JSON.stringify({
    version: PLAN_FORMAT_VERSION,
    faction: plan.faction,
    turn: plan.turn,
    units: plan.units,
  });
}

export function deserializeTurnPlan(json: string): TurnPlan {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Nieprawidłowy plan: to nie jest JSON');
  }

  if (!isRecord(parsed)) {
    throw new Error('Nieprawidłowy plan: brak obiektu');
  }

  if (parsed.version !== PLAN_FORMAT_VERSION) {
    throw new Error(`Nieobsługiwana wersja planu: ${String(parsed.version)}`);
  }

  if (typeof parsed.faction !== 'string' || !FACTION_SET.has(parsed.faction)) {
    throw new Error(`Nieprawidłowy plan: strona ${String(parsed.faction)}`);
  }

  if (typeof parsed.turn !== 'number' || !Number.isInteger(parsed.turn) || parsed.turn < 1) {
    throw new Error('Nieprawidłowy plan: numer tury');
  }

  if (!Array.isArray(parsed.units)) {
    throw new Error('Nieprawidłowy plan: brak listy jednostek');
  }

  return {
    faction: parsed.faction as FactionId,
    turn: parsed.turn,
    units: parsed.units.map(parseUnitPlan),
  };
}

function parseUnitPlan(value: unknown): UnitPlan {
  if (!isRecord(value) || typeof value.unitId !== 'string' || !Array.isArray(value.actions)) {
    throw new Error('Nieprawidłowy plan: jednostka');
  }

  return {
    unitId: value.unitId,
    actions: value.actions.map(parseAction),
  };
}

function parseAction(value: unknown): PlanAction {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new Error('Nieprawidłowa akcja planu');
  }

  if (value.kind === 'move') {
    if (!Array.isArray(value.path) || value.path.length === 0) {
      throw new Error('Nieprawidłowa akcja planu: pusta trasa');
    }

    return { kind: 'move', path: value.path.map(parseCoord) };
  }

  if (value.kind === 'attack') {
    if (typeof value.targetId !== 'string') {
      throw new Error('Nieprawidłowa akcja planu: brak celu');
    }

    return { kind: 'attack', targetId: value.targetId };
  }

  if (value.kind === 'board') {
    if (typeof value.targetId !== 'string') {
      throw new Error('Nieprawidłowa akcja planu: brak pojazdu');
    }

    if (!Array.isArray(value.path) || value.path.length === 0) {
      throw new Error('Nieprawidłowa akcja planu: pusta trasa wsiadania');
    }

    return {
      kind: 'board',
      targetId: value.targetId,
      path: value.path.map(parseCoord),
    };
  }

  throw new Error(`Nieprawidłowa akcja planu: ${value.kind}`);
}

function parseCoord(value: unknown): HexCoord {
  if (
    !isRecord(value) ||
    typeof value.col !== 'number' ||
    !Number.isFinite(value.col) ||
    typeof value.row !== 'number' ||
    !Number.isFinite(value.row)
  ) {
    throw new Error('Nieprawidłowa akcja planu: współrzędne');
  }

  return { col: value.col, row: value.row };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
