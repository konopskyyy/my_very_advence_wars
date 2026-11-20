import type { HexCoord } from '../map';
import {
  ARTILLERY_STATS,
  createArtillery,
  type ArtilleryUnit,
} from './artillery';
import { BOMBER_STATS, createBomber, type BomberUnit } from './bomber';
import { createHelicopter, HELICOPTER_STATS, type HelicopterUnit } from './helicopter';
import type { FactionId } from './faction';
import { createInfantry, INFANTRY_STATS, type InfantryUnit } from './infantry';
import { createScout, SCOUT_STATS, type ScoutUnit } from './scout';
import { createTank, TANK_STATS, type TankUnit } from './tank';
import type { UnitKind, UnitStats } from './types';

export type Unit =
  | InfantryUnit
  | TankUnit
  | ArtilleryUnit
  | ScoutUnit
  | BomberUnit
  | HelicopterUnit;

export const UNIT_DEFS: Record<UnitKind, UnitStats> = {
  infantry: INFANTRY_STATS,
  tank: TANK_STATS,
  artillery: ARTILLERY_STATS,
  scout: SCOUT_STATS,
  bomber: BOMBER_STATS,
  helicopter: HELICOPTER_STATS,
};

export const UNIT_KINDS: readonly UnitKind[] = [
  'infantry',
  'tank',
  'artillery',
  'scout',
  'bomber',
  'helicopter',
];

export function unitAttack(unit: Unit): number {
  return unit.attackOverride ?? UNIT_DEFS[unit.kind].attack;
}

export function createUnit(
  id: string,
  kind: UnitKind,
  faction: FactionId,
  pos: HexCoord,
): Unit {
  switch (kind) {
    case 'infantry':
      return createInfantry(id, faction, pos);
    case 'tank':
      return createTank(id, faction, pos);
    case 'artillery':
      return createArtillery(id, faction, pos);
    case 'scout':
      return createScout(id, faction, pos);
    case 'bomber':
      return createBomber(id, faction, pos);
    case 'helicopter':
      return createHelicopter(id, faction, pos);
  }
}
