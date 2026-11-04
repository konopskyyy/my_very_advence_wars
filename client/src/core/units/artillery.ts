import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import { FULL_MAP_RANGE, type UnitBase, type UnitStats } from './types';

export interface ArtilleryUnit extends UnitBase {
  readonly kind: 'artillery';
  readonly ammo: number;
}

export const ARTILLERY_MOVE_RANGE = 2;
export const ARTILLERY_AMMO = ARTILLERY_MOVE_RANGE;

export const ARTILLERY_STATS: UnitStats = {
  label: 'Artyleria',
  maxHp: 14,
  moveRange: ARTILLERY_MOVE_RANGE,
  attack: 12,
  defense: 3,
  visionRange: FULL_MAP_RANGE,
  attackRange: FULL_MAP_RANGE,
  ammo: ARTILLERY_AMMO,
};

export const ARTILLERY_SHOT_MOVE_COST = ARTILLERY_STATS.moveRange / ARTILLERY_AMMO;

export function createArtillery(id: string, faction: FactionId, pos: HexCoord): ArtilleryUnit {
  return {
    id,
    faction,
    pos,
    kind: 'artillery',
    hp: ARTILLERY_STATS.maxHp,
    movesLeft: ARTILLERY_STATS.moveRange,
    hasActed: false,
    ammo: ARTILLERY_AMMO,
  };
}
