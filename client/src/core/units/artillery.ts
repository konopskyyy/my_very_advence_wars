import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';

export interface ArtilleryUnit extends UnitBase {
  readonly kind: 'artillery';
  readonly ammo: number;
}

export const ARTILLERY_STATS: UnitStats = {
  label: 'Artyleria',
  maxHp: 14,
  moveRange: 2,
  attack: 12,
  defense: 3,
  visionRange: 2,
  attackRange: 3,
};

export const ARTILLERY_AMMO = 6;

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
