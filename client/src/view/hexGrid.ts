import Phaser from 'phaser';
import { cellCoord, hexCorners, hexToPixel, type GameMap, type HexCoord } from '../core/map';
import { TERRAIN_DEFS, TERRAIN_IDS, type TerrainId } from '../core/terrain';

export const HEX_SIZE = 22;

const textureCache = new Map<string, Phaser.Textures.CanvasTexture>();

export function tracePolygon(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly { x: number; y: number }[],
): void {
  const first = points[0];
  if (!first) {
    return;
  }

  graphics.beginPath();
  graphics.moveTo(first.x, first.y);

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point) {
      graphics.lineTo(point.x, point.y);
    }
  }

  graphics.closePath();
}

export function colorToCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function outlineHex(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  color: number,
  width: number,
  size: number = HEX_SIZE,
): void {
  tracePolygon(graphics, hexCorners(center, size));
  graphics.lineStyle(width, color, 1);
  graphics.strokePath();
}

export function hexTextureKey(size: number): string {
  return `hex-${size}`;
}

export function hexTexture(
  scene: Phaser.Scene,
  size: number,
): Phaser.Textures.CanvasTexture {
  const key = hexTextureKey(size);
  const cached = textureCache.get(key);

  if (cached) {
    return cached;
  }

  if (scene.textures.exists(key)) {
    const existing = scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    textureCache.set(key, existing);
    return existing;
  }

  const cellWidth = Math.ceil(Math.sqrt(3) * size) + 2;
  const cellHeight = Math.ceil(2 * size) + 2;

  const texture = scene.textures.createCanvas(
    key,
    cellWidth * TERRAIN_IDS.length,
    cellHeight,
  );

  if (!texture) {
    throw new Error('nie udało się utworzyć tekstury heksów');
  }

  const context = texture.getContext();

  TERRAIN_IDS.forEach((terrain, index) => {
    const center = { x: index * cellWidth + cellWidth / 2, y: cellHeight / 2 };
    const corners = hexCorners(center, size);
    const first = corners[0];

    context.beginPath();
    context.moveTo(first?.x ?? 0, first?.y ?? 0);

    for (const corner of corners.slice(1)) {
      context.lineTo(corner.x, corner.y);
    }

    context.closePath();
    context.fillStyle = colorToCss(TERRAIN_DEFS[terrain].color);
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(27, 36, 25, 0.6)';
    context.stroke();

    texture.add(terrain, 0, index * cellWidth, 0, cellWidth, cellHeight);
  });

  texture.refresh();
  textureCache.set(key, texture);

  return texture;
}

export function createHexSprite(
  scene: Phaser.Scene,
  terrain: TerrainId,
  size: number,
): Phaser.GameObjects.Image {
  hexTexture(scene, size);

  return scene.add.image(0, 0, hexTextureKey(size), terrain);
}

export class HexMapView {
  private readonly sprites = new Map<string, Phaser.GameObjects.Image>();

  private map: GameMap;

  constructor(
    private readonly scene: Phaser.Scene,
    map: GameMap,
    readonly size: number = HEX_SIZE,
  ) {
    this.map = map;
    hexTexture(scene, size);
    this.sync();
  }

  get tileCount(): number {
    return this.sprites.size;
  }

  center(coord: HexCoord): { x: number; y: number } {
    return hexToPixel(coord, this.size);
  }

  setMap(map: GameMap): void {
    this.map = map;
    this.sync();
  }

  objects(): Phaser.GameObjects.Image[] {
    return [...this.sprites.values()];
  }

  private sync(): void {
    const cells = this.map.cells;

    for (const [key, sprite] of this.sprites) {
      const terrain = cells[key];

      if (terrain === undefined) {
        sprite.destroy();
        this.sprites.delete(key);
        continue;
      }

      if (sprite.frame.name !== terrain) {
        sprite.setFrame(terrain);
      }
    }

    for (const [key, terrain] of Object.entries(cells)) {
      if (this.sprites.has(key)) {
        continue;
      }

      const center = this.center(cellCoord(key));
      const sprite = createHexSprite(this.scene, terrain, this.size);

      sprite.setPosition(center.x, center.y);
      sprite.setDepth(0);
      this.sprites.set(key, sprite);
    }
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }

    this.sprites.clear();
  }
}
