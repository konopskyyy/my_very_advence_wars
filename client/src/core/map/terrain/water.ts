import { IMPASSABLE } from './constants';
import type { TerrainDef } from './types';

export const WATER_DEF: TerrainDef = {
  label: 'Woda',
  color: 0x2f6ea8,
  moveCost: IMPASSABLE,
  defense: 0,
};
