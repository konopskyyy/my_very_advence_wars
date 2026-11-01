import { CITY_DEF } from './city';
import { FOREST_DEF } from './forest';
import { MOUNTAIN_DEF } from './mountain';
import { PLAIN_DEF } from './plain';
import { ROAD_DEF } from './road';
import { SWAMP_DEF } from './swamp';
import { WATER_DEF } from './water';
import type { TerrainDef, TerrainId } from './types';

export * from './types';
export * from './constants';
export * from './variants';
export * from './plain';
export * from './forest';
export * from './water';
export * from './mountain';
export * from './swamp';
export * from './road';
export * from './city';

export const TERRAIN_DEFS: Record<TerrainId, TerrainDef> = {
  plain: PLAIN_DEF,
  forest: FOREST_DEF,
  water: WATER_DEF,
  mountain: MOUNTAIN_DEF,
  swamp: SWAMP_DEF,
  road: ROAD_DEF,
  city: CITY_DEF,
};

export const TERRAIN_IDS: readonly TerrainId[] = [
  'plain',
  'forest',
  'water',
  'mountain',
  'swamp',
  'road',
  'city',
];
