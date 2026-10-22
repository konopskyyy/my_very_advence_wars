import Phaser from 'phaser';
import { cellCoord, hexToPixel, mapPixelBounds, type GameMap } from '../core/map';
import { createHexSprite } from './hexGrid';

export interface PreviewLayout {
  readonly origin: { x: number; y: number };
  readonly width: number;
  readonly height: number;
}

export function previewLayout(map: GameMap, size: number, padding: number): PreviewLayout {
  const bounds = mapPixelBounds(map, size);

  if (!bounds) {
    return { origin: { x: padding, y: padding }, width: 0, height: 0 };
  }

  return {
    origin: { x: padding - bounds.left, y: padding - bounds.top },
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  };
}

export function drawMapPreview(
  scene: Phaser.Scene,
  map: GameMap,
  size: number,
  origin: { x: number; y: number },
): Phaser.GameObjects.Image[] {
  const sprites: Phaser.GameObjects.Image[] = [];

  for (const [key, terrain] of Object.entries(map.cells)) {
    const center = hexToPixel(cellCoord(key), size);
    const sprite = createHexSprite(scene, terrain, size);

    sprite.setPosition(center.x + origin.x, center.y + origin.y);
    sprite.setDepth(0);
    sprites.push(sprite);
  }

  return sprites;
}
