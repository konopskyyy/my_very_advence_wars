import type { HexCoord } from './hex';

export type UnitKind = 'infantry' | 'tank' | 'artillery' | 'scout';

export type FactionId = 'blue' | 'red' | 'neutral';

export interface FactionDef {
  readonly label: string;
  readonly color: number;
}

export const FACTION_DEFS: Record<FactionId, FactionDef> = {
  blue: { label: 'Niebieska', color: 0x4a86e8 },
  red: { label: 'Czerwona', color: 0xe0563f },
  neutral: { label: 'Neutralna', color: 0x9aa0a6 },
};

interface UnitBase {
  readonly id: string;
  readonly faction: FactionId;
  readonly pos: HexCoord;
  readonly hp: number;
  readonly movesLeft: number;
  readonly hasActed: boolean;
}

export type Unit =
  | (UnitBase & { readonly kind: 'infantry' })
  | (UnitBase & { readonly kind: 'tank'; readonly ammo: number })
  | (UnitBase & { readonly kind: 'artillery'; readonly ammo: number })
  | (UnitBase & { readonly kind: 'scout' });

export interface UnitStats {
  readonly label: string;
  readonly maxHp: number;
  readonly moveRange: number;
  readonly attack: number;
  readonly defense: number;
}

export const UNIT_DEFS: Record<UnitKind, UnitStats> = {
  infantry: { label: 'Piechota', maxHp: 10, moveRange: 4, attack: 5, defense: 4 },
  tank: { label: 'Czołg', maxHp: 20, moveRange: 3, attack: 9, defense: 7 },
  artillery: { label: 'Artyleria', maxHp: 14, moveRange: 2, attack: 12, defense: 3 },
  scout: { label: 'Zwiad', maxHp: 8, moveRange: 6, attack: 3, defense: 2 },
};

export const UNIT_KINDS: readonly UnitKind[] = ['infantry', 'tank', 'artillery', 'scout'];

export function createUnit(
  id: string,
  kind: UnitKind,
  faction: FactionId,
  pos: HexCoord,
): Unit {
  const stats = UNIT_DEFS[kind];
  const base = {
    id,
    faction,
    pos,
    hp: stats.maxHp,
    movesLeft: stats.moveRange,
    hasActed: false,
  };

  switch (kind) {
    case 'infantry':
    case 'scout':
      return { ...base, kind };
    case 'tank':
    case 'artillery':
      return { ...base, kind, ammo: 6 };
  }
}
