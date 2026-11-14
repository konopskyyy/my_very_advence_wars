import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';

export interface TankUnit extends UnitBase {
  readonly kind: 'tank';
}

export const TANK_MOVE_RANGE = 3;
export const TANK_AMMO = 6;

export const TANK_STATS: UnitStats = {
  label: 'Czołg',
  cost: 300,
  maxHp: 20,
  moveRange: TANK_MOVE_RANGE,
  attack: 9,
  defense: 7,
  visionRange: 3,
  attackRange: 1,
  ammo: TANK_AMMO,
  capacity: 1,
  carries: ['infantry'],
};

export function createTank(id: string, faction: FactionId, pos: HexCoord): TankUnit {
  return {
    id,
    faction,
    pos,
    kind: 'tank',
    hp: TANK_STATS.maxHp,
    movesLeft: TANK_STATS.moveRange,
    hasActed: false,
  };
}
