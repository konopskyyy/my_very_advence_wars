import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import { FULL_MAP_RANGE, type UnitBase, type UnitStats } from './types';
import { BOMB } from './weapons';

export interface BomberUnit extends UnitBase {
  readonly kind: 'bomber';
}

export const BOMBER_MOVE_RANGE = 2;
export const BOMBER_AMMO = 1;

export const BOMBER_STATS: UnitStats = {
  label: 'Bombowiec',
  cost: 250,
  maxHp: 10,
  moveRange: BOMBER_MOVE_RANGE,
  attack: 25,
  defense: 2,
  visionRange: FULL_MAP_RANGE,
  attackRange: FULL_MAP_RANGE,
  ammo: BOMBER_AMMO,
  weapon: BOMB,
};

export const BOMBER_SHOT_MOVE_COST = BOMBER_STATS.moveRange / BOMBER_AMMO;

export function createBomber(id: string, faction: FactionId, pos: HexCoord): BomberUnit {
  return {
    id,
    faction,
    pos,
    kind: 'bomber',
    hp: BOMBER_STATS.maxHp,
    movesLeft: BOMBER_STATS.moveRange,
    hasActed: false,
  };
}
