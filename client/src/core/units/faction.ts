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

export const FACTION_IDS: readonly FactionId[] = ['blue', 'red', 'neutral'];
