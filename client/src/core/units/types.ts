import type { HexCoord } from '../map';
import type { FactionId } from './faction';

export type UnitKind = 'infantry' | 'tank' | 'artillery' | 'scout';

export interface UnitBase {
  readonly id: string;
  readonly faction: FactionId;
  readonly pos: HexCoord;
  readonly hp: number;
  readonly movesLeft: number;
  readonly hasActed: boolean;
}

export interface UnitStats {
  readonly label: string;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attack: number;
  readonly defense: number;
  readonly visionRange: number;
  readonly attackRange: number;
}
