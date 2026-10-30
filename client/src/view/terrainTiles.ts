import Phaser from 'phaser';
import { pickVariantIndex, type TerrainId } from '../core/terrain';
import city1 from '../assets/map/city-1.svg?url';
import city2 from '../assets/map/city-2.svg?url';
import forest1 from '../assets/map/forest-1.svg?url';
import forest2 from '../assets/map/forest-2.svg?url';
import plain1 from '../assets/map/plain-1.svg?url';
import plain2 from '../assets/map/plain-2.svg?url';
import water1 from '../assets/map/water-1.svg?url';
import water2 from '../assets/map/water-2.svg?url';

const TILE_TEXTURES: Partial<Record<TerrainId, readonly string[]>> = {
  plain: [plain1, plain2],
  forest: [forest1, forest2],
  water: [water1, water2],
  city: [city1, city2],
};

const TILE_TEXTURE_SIZE = 256;
const HEX_ART_SIZE = 240;
// Nakładka maskuje półprzezroczysty rant tekstury na styku heksów.
const TILE_OVERLAP_SCALE = 1.03;

function textureKey(terrain: TerrainId, variant: number): string {
  return `terrain-${terrain}-${variant}`;
}

export function preloadTerrainTiles(scene: Phaser.Scene): void {
  for (const [terrain, urls] of Object.entries(TILE_TEXTURES) as [
    TerrainId,
    readonly string[],
  ][]) {
    urls.forEach((url, variant) => {
      const key = textureKey(terrain, variant);

      if (!scene.textures.exists(key)) {
        scene.load.svg(key, url, {
          width: TILE_TEXTURE_SIZE,
          height: TILE_TEXTURE_SIZE,
        });
      }
    });
  }
}

export function terrainTileTextureKey(
  terrain: TerrainId,
  random: () => number = Math.random,
): string | null {
  const variants = TILE_TEXTURES[terrain];

  if (!variants || variants.length === 0) {
    return null;
  }

  return textureKey(terrain, pickVariantIndex(variants.length, random));
}

export function terrainTileDisplaySize(size: number): number {
  return (size * 2 * TILE_TEXTURE_SIZE * TILE_OVERLAP_SCALE) / HEX_ART_SIZE;
}
