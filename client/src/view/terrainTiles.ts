import Phaser from 'phaser';
import { pickVariantIndex, TERRAIN_IDS, type TerrainId } from '../core/map/terrain';

const TILE_TEXTURE_SIZE = 256;
const HEX_ART_SIZE = 240;
// Nakładka maskuje półprzezroczysty rant tekstury na styku heksów.
const TILE_OVERLAP_SCALE = 1.03;

const TILE_URLS = import.meta.glob<string>('../assets/map/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const TILE_VARIANTS = collectVariants(TILE_URLS);

function collectVariants(
  urls: Record<string, string>,
): Partial<Record<TerrainId, readonly string[]>> {
  const grouped = new Map<TerrainId, Array<{ order: number; url: string }>>();

  for (const [path, url] of Object.entries(urls)) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    const [terrain, variant] = name.replace(/\.svg$/, '').split('-');

    if (!terrain || !variant || !TERRAIN_IDS.includes(terrain as TerrainId)) {
      continue;
    }

    const entries = grouped.get(terrain as TerrainId) ?? [];
    entries.push({ order: Number(variant), url });
    grouped.set(terrain as TerrainId, entries);
  }

  const variants: Partial<Record<TerrainId, readonly string[]>> = {};

  for (const [terrain, entries] of grouped) {
    variants[terrain] = entries
      .sort((left, right) => left.order - right.order)
      .map((entry) => entry.url);
  }

  return variants;
}

function textureKey(terrain: TerrainId, variant: number): string {
  return `terrain-${terrain}-${variant}`;
}

export function preloadTerrainTiles(scene: Phaser.Scene): void {
  for (const [terrain, urls] of Object.entries(TILE_VARIANTS) as [
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
  const variants = TILE_VARIANTS[terrain];

  if (!variants || variants.length === 0) {
    return null;
  }

  return textureKey(terrain, pickVariantIndex(variants.length, random));
}

export function terrainTileDisplaySize(size: number): number {
  return (size * 2 * TILE_TEXTURE_SIZE * TILE_OVERLAP_SCALE) / HEX_ART_SIZE;
}
