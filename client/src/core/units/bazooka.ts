import type { HexCoord } from '../map';
import type { FactionId } from './faction';
import type { UnitBase, UnitStats } from './types';
import { BAZOOKA } from './weapons';

export interface BazookaUnit extends UnitBase {
  readonly kind: 'bazooka';
}

export const BAZOOKA_STATS: UnitStats = {
  label: 'Żołnierz z bazooką',
  cost: 200,
  maxHp: 10,
  moveRange: 3,
  attack: 15,
  defense: 3,
  visionRange: 2,
  attackRange: 2,
  weapon: BAZOOKA,
  moveSound: 'step',
  deathSound: 'death',
};

export function createBazooka(id: string, faction: FactionId, pos: HexCoord): BazookaUnit {
  return {
    id,
    faction,
    pos,
    kind: 'bazooka',
    hp: BAZOOKA_STATS.maxHp,
    movesLeft: BAZOOKA_STATS.moveRange,
    hasActed: false,
  };
}
