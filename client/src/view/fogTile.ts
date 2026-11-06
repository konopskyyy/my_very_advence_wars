import Phaser from 'phaser';
import fogTileUrl from '../assets/map/ai/fog_of_war_tile.svg?url';

export const FOG_TILE_TEXTURE_KEY = 'fog-of-war-tile';

const FOG_TILE_SIZE = 256;

export function preloadFogTile(scene: Phaser.Scene): void {
  if (scene.textures.exists(FOG_TILE_TEXTURE_KEY)) {
    return;
  }

  scene.load.svg(FOG_TILE_TEXTURE_KEY, fogTileUrl, {
    width: FOG_TILE_SIZE,
    height: FOG_TILE_SIZE,
  });
}

export function fogTileImage(scene: Phaser.Scene): CanvasImageSource {
  return scene.textures.get(FOG_TILE_TEXTURE_KEY).getSourceImage() as CanvasImageSource;
}
