import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import { FULL_MAP_RANGE, type UnitBase, type UnitStats } from './types';

export interface ScoutUnit extends UnitBase {
  readonly kind: 'scout';
}

export const SCOUT_STATS: UnitStats = {
  label: 'Zwiadowca',
  cost: 150,
  maxHp: 8,
  moveRange: 6,
  attack: 3,
  defense: 2,
  visionRange: FULL_MAP_RANGE,
  attackRange: 1,
  capacity: 1,
  carries: ['infantry'],
};

export function createScout(id: string, faction: FactionId, pos: HexCoord): ScoutUnit {
  return {
    id,
    faction,
    pos,
    kind: 'scout',
    hp: SCOUT_STATS.maxHp,
    movesLeft: SCOUT_STATS.moveRange,
    hasActed: false,
  };
}
