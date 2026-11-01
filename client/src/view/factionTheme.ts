import { FACTION_DEFS, type FactionId } from '../core/units';

export interface FactionTheme {
  readonly accent: number;
  readonly accentBright: number;
  readonly accentDark: number;
  readonly accentSoft: string;
  readonly barBackground: number;
  readonly divider: number;
}

export const FACTION_THEMES: Record<FactionId, FactionTheme> = {
  blue: {
    accent: FACTION_DEFS.blue.color,
    accentBright: 0x7aabff,
    accentDark: 0x1e4278,
    accentSoft: '#a6c8ff',
    barBackground: 0x0a101b,
    divider: 0x243652,
  },
  red: {
    accent: FACTION_DEFS.red.color,
    accentBright: 0xff8a74,
    accentDark: 0x6e2a1f,
    accentSoft: '#ffb3a6',
    barBackground: 0x140d0b,
    divider: 0x4a2a24,
  },
  neutral: {
    accent: FACTION_DEFS.neutral.color,
    accentBright: 0xc4c9cf,
    accentDark: 0x3b3f44,
    accentSoft: '#d5d9de',
    barBackground: 0x0f1114,
    divider: 0x33373c,
  },
};
