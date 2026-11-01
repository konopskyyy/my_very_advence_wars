import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';

export interface TankUnit extends UnitBase {
  readonly kind: 'tank';
  readonly ammo: number;
}

export const TANK_STATS: UnitStats = {
  label: 'Czołg',
  maxHp: 20,
  moveRange: 3,
  attack: 9,
  defense: 7,
};

export const TANK_AMMO = 6;

export function createTank(id: string, faction: FactionId, pos: HexCoord): TankUnit {
  return {
    id,
    faction,
    pos,
    kind: 'tank',
    hp: TANK_STATS.maxHp,
    movesLeft: TANK_STATS.moveRange,
    hasActed: false,
    ammo: TANK_AMMO,
  };
}
