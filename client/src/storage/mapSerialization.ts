import type { GameState } from '../core/state';
import type { TerrainId } from '../core/terrain';
import { TERRAIN_IDS } from '../core/terrain';
import type { FactionId, Unit } from '../core/units';
import { FACTION_IDS, UNIT_KINDS } from '../core/units';

const TERRAIN_SET = new Set<string>(TERRAIN_IDS);
const FACTION_SET = new Set<string>(FACTION_IDS);
const UNIT_KIND_SET = new Set<string>(UNIT_KINDS);
const CELL_KEY = /^-?\d+,-?\d+$/;

export function serializeGameState(state: GameState): string {
  return JSON.stringify({
    map: state.map,
    units: state.units,
    nextUnitSeq: state.nextUnitSeq,
  });
}

export function deserializeGameState(json: string): GameState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Nieprawidłowy stan gry: to nie jest JSON');
  }

  if (!isRecord(parsed) || !isRecord(parsed.map) || !isRecord(parsed.map.cells)) {
    throw new Error('Nieprawidłowy stan gry: brak mapy');
  }

  if (!Array.isArray(parsed.units)) {
    throw new Error('Nieprawidłowy stan gry: brak listy jednostek');
  }

  if (typeof parsed.nextUnitSeq !== 'number' || !Number.isFinite(parsed.nextUnitSeq)) {
    throw new Error('Nieprawidłowy stan gry: brak licznika jednostek');
  }

  const cells: Record<string, TerrainId> = {};

  for (const [key, terrain] of Object.entries(parsed.map.cells)) {
    if (!CELL_KEY.test(key) || typeof terrain !== 'string' || !TERRAIN_SET.has(terrain)) {
      throw new Error(`Nieprawidłowy kafelek: ${key}`);
    }

    cells[key] = terrain as TerrainId;
  }

  return {
    map: { cells },
    units: parsed.units.map(parseUnit),
    nextUnitSeq: parsed.nextUnitSeq,
  };
}

function parseUnit(value: unknown): Unit {
  if (!isRecord(value) || !isRecord(value.pos)) {
    throw new Error('Nieprawidłowa jednostka');
  }

  const { id, kind, faction, pos, hp, movesLeft, hasActed, ammo } = value;

  if (typeof id !== 'string') {
    throw new Error('Nieprawidłowa jednostka: brak identyfikatora');
  }

  if (typeof kind !== 'string' || !UNIT_KIND_SET.has(kind)) {
    throw new Error(`Nieprawidłowa jednostka: rodzaj ${String(kind)}`);
  }

  if (typeof faction !== 'string' || !FACTION_SET.has(faction)) {
    throw new Error(`Nieprawidłowa jednostka: strona ${String(faction)}`);
  }

  if (
    typeof pos.col !== 'number' ||
    !Number.isFinite(pos.col) ||
    typeof pos.row !== 'number' ||
    !Number.isFinite(pos.row)
  ) {
    throw new Error('Nieprawidłowa jednostka: pozycja');
  }

  if (
    typeof hp !== 'number' ||
    !Number.isFinite(hp) ||
    typeof movesLeft !== 'number' ||
    !Number.isFinite(movesLeft) ||
    typeof hasActed !== 'boolean'
  ) {
    throw new Error('Nieprawidłowa jednostka: stan');
  }

  const base = {
    id,
    faction: faction as FactionId,
    pos: { col: pos.col, row: pos.row },
    hp,
    movesLeft,
    hasActed,
  };

  if (kind === 'tank' || kind === 'artillery') {
    if (typeof ammo !== 'number' || !Number.isFinite(ammo)) {
      throw new Error('Nieprawidłowa jednostka: amunicja');
    }

    return { ...base, kind, ammo };
  }

  return { ...base, kind: kind as 'infantry' | 'scout' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
