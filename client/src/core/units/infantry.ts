import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';

export interface InfantryUnit extends UnitBase {
  readonly kind: 'infantry';
}

export const INFANTRY_STATS: UnitStats = {
  label: 'Piechota',
  maxHp: 10,
  moveRange: 4,
  attack: 5,
  defense: 4,
};

export function createInfantry(id: string, faction: FactionId, pos: HexCoord): InfantryUnit {
  return {
    id,
    faction,
    pos,
    kind: 'infantry',
    hp: INFANTRY_STATS.maxHp,
    movesLeft: INFANTRY_STATS.moveRange,
    hasActed: false,
  };
}
