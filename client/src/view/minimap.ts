import type Phaser from 'phaser';
import { cellCoord, hexToPixel, type GameMap, type HexCoord } from '../core/map';
import { TERRAIN_DEFS } from '../core/map/terrain';
import { FACTION_DEFS, type Unit } from '../core/units';
import { HEX_SIZE } from './hexGrid';

const WIDTH = 176;
const HEIGHT = 132;
const MARGIN = 12;
const PADDING = 6;
const DEPTH = 30;

export interface MinimapLayout {
  readonly cellSize: number;
  point(coord: HexCoord): { x: number; y: number };
  pixelPoint(x: number, y: number): { x: number; y: number };
}

export function minimapLayout(
  map: GameMap,
  width: number,
  height: number,
  padding = PADDING,
): MinimapLayout {
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  let first = true;

  for (const key of Object.keys(map.cells)) {
    const center = hexToPixel(cellCoord(key), 1);

    if (first) {
      minX = center.x;
      maxX = center.x;
      minY = center.y;
      maxY = center.y;
      first = false;
      continue;
    }

    minX = Math.min(minX, center.x);
    maxX = Math.max(maxX, center.x);
    minY = Math.min(minY, center.y);
    maxY = Math.max(maxY, center.y);
  }

  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min(innerWidth / spanX, innerHeight / spanY);
  const offsetX = padding + (innerWidth - spanX * scale) / 2 - minX * scale;
  const offsetY = padding + (innerHeight - spanY * scale) / 2 - minY * scale;

  const pixelPoint = (x: number, y: number) => ({
    x: offsetX + x * scale,
    y: offsetY + y * scale,
  });

  return {
    cellSize: Math.max(2, scale * 1.35),
    point: (coord) => {
      const center = hexToPixel(coord, 1);

      return pixelPoint(center.x, center.y);
    },
    pixelPoint,
  };
}

export interface MinimapState {
  readonly map: GameMap;
  readonly units: readonly Unit[];
  readonly camera: Phaser.Cameras.Scene2D.Camera;
  readonly bottomInset: number;
  readonly spawn?: HexCoord;
}

export class Minimap {
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly terrain: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private terrainMap?: GameMap;
  private terrainTop?: number;
  private left = MARGIN;
  private top = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.frame = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.terrain = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1);
    this.overlay = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 2);
    this.title = scene.add
      .text(0, 0, 'MAPA', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.frame, this.terrain, this.overlay, this.title];
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this.left &&
      x <= this.left + WIDTH &&
      y >= this.top &&
      y <= this.top + HEIGHT
    );
  }

  update({ map, units, camera, bottomInset, spawn }: MinimapState): void {
    this.top = this.scene.scale.height - bottomInset - HEIGHT;
    this.layoutFrame();

    if (map !== this.terrainMap || this.top !== this.terrainTop) {
      this.terrainMap = map;
      this.terrainTop = this.top;
      this.drawTerrain(map);
    }

    const layout = minimapLayout(map, WIDTH - PADDING * 2, HEIGHT - PADDING * 2);
    const originX = this.left + PADDING;
    const originY = this.top + PADDING;
    const toScreen = (point: { x: number; y: number }) => ({
      x: originX + point.x,
      y: originY + point.y,
    });

    this.overlay.clear();

    if (spawn) {
      const base = toScreen(layout.point(spawn));

      this.overlay.fillStyle(0xf2d35c, 1);
      this.overlay.fillRect(base.x - 2, base.y - 2, 4, 4);
      this.overlay.lineStyle(1, 0xf2d35c, 0.9);
      this.overlay.lineBetween(base.x, base.y - 2, base.x, base.y - 7);
      this.overlay.fillStyle(0xffffff, 1);
      this.overlay.fillTriangle(
        base.x,
        base.y - 7,
        base.x + 5,
        base.y - 5,
        base.x,
        base.y - 3,
      );
    }

    for (const unit of units) {
      const point = toScreen(layout.point(unit.pos));

      this.overlay.fillStyle(FACTION_DEFS[unit.faction].color, 1);
      this.overlay.fillCircle(point.x, point.y, 2.6);
      this.overlay.lineStyle(1, 0x05080c, 0.9);
      this.overlay.strokeCircle(point.x, point.y, 2.6);
    }

    const view = camera.worldView;
    const topLeft = toScreen(
      layout.pixelPoint(view.x / HEX_SIZE, view.y / HEX_SIZE),
    );
    const bottomRight = toScreen(
      layout.pixelPoint(
        (view.x + view.width) / HEX_SIZE,
        (view.y + view.height) / HEX_SIZE,
      ),
    );

    this.overlay.lineStyle(1, 0xffffff, 0.85);
    this.overlay.strokeRect(
      topLeft.x,
      topLeft.y,
      Math.max(2, bottomRight.x - topLeft.x),
      Math.max(2, bottomRight.y - topLeft.y),
    );
  }

  private layoutFrame(): void {
    this.frame.clear();
    this.frame.fillStyle(0x0b0f14, 0.86);
    this.frame.fillRoundedRect(this.left, this.top, WIDTH, HEIGHT, 6);
    this.frame.lineStyle(1, 0x6fd08c, 0.55);
    this.frame.strokeRoundedRect(this.left, this.top, WIDTH, HEIGHT, 6);

    this.title.setPosition(this.left + 8, this.top + 4);
  }

  private drawTerrain(map: GameMap): void {
    const layout = minimapLayout(map, WIDTH - PADDING * 2, HEIGHT - PADDING * 2);
    const size = layout.cellSize;
    const originX = this.left + PADDING;
    const originY = this.top + PADDING;

    this.terrain.clear();

    for (const [key, terrain] of Object.entries(map.cells)) {
      const point = layout.point(cellCoord(key));

      this.terrain.fillStyle(TERRAIN_DEFS[terrain].color, 0.95);
      this.terrain.fillRect(
        originX + point.x - size / 2,
        originY + point.y - size / 2,
        size,
        size,
      );
    }
  }
}
