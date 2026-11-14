import type { HexCoord } from '../map';
import type { SoundId } from '../sound';
import type { FactionId } from './faction';
import type { Unit } from './model';
import type { Weapon } from './weapons';

export type UnitKind = 'infantry' | 'tank' | 'artillery' | 'scout';

export const FULL_MAP_RANGE = 999;

export interface UnitBase {
  readonly id: string;
  readonly faction: FactionId;
  readonly pos: HexCoord;
  readonly hp: number;
  readonly movesLeft: number;
  readonly hasActed: boolean;
  readonly cargo?: readonly Unit[];
}

export interface UnitStats {
  readonly label: string;
  readonly cost: number;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attack: number;
  readonly defense: number;
  readonly visionRange: number;
  readonly attackRange: number;
  readonly ammo?: number;
  readonly weapon?: Weapon;
  readonly moveSound?: SoundId;
  readonly deathSound?: SoundId;
  readonly capacity?: number;
  readonly carries?: readonly UnitKind[];
}
