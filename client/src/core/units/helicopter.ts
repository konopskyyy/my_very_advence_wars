import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';

export interface HelicopterUnit extends UnitBase {
  readonly kind: 'helicopter';
}

export const HELICOPTER_STATS: UnitStats = {
  label: 'Śmigłowiec',
  cost: 300,
  maxHp: 12,
  moveRange: 5,
  attack: 18,
  defense: 3,
  visionRange: 4,
  attackRange: 2,
  ammo: 6,
};

export function createHelicopter(id: string, faction: FactionId, pos: HexCoord): HelicopterUnit {
  return {
    id,
    faction,
    pos,
    kind: 'helicopter',
    hp: HELICOPTER_STATS.maxHp,
    movesLeft: HELICOPTER_STATS.moveRange,
    hasActed: false,
  };
}
