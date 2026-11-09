import Phaser from 'phaser';
import {
  cellCoord,
  hexCorners,
  hexToPixel,
  mapPixelBounds,
  type GameMap,
} from '../core/map';
import { fogTileImage } from './fogTile';
import { HEX_SIZE } from './hexGrid';
import { terrainTileDisplaySize } from './terrainTiles';

const TEXTURE_KEY = 'vision-fog';
const FOG_DEPTH = 1;
// Ten sam kolor co tło gry, żeby prostokąt tekstury nie rysował ramki wokół mapy.
const UNKNOWN_COLOR = '#0b0b0b';
const BOUNDS_MARGIN_RATIO = 0.06;
const FOG_TILE_ALPHA = 0.45;
const CLEAR_OVERLAP = 0.75;
const ROTATION_STEPS = 6;

interface FogBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface FogCell {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
}

function rotationFor(key: string): number {
  let hash = 0;

  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return (hash % ROTATION_STEPS) * ((Math.PI * 2) / ROTATION_STEPS);
}

function ensureTexture(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(TEXTURE_KEY)) {
    return scene.textures.get(TEXTURE_KEY) as Phaser.Textures.CanvasTexture;
  }

  const texture = scene.textures.createCanvas(TEXTURE_KEY, 1, 1);

  if (!texture) {
    throw new Error('nie udało się utworzyć tekstury mgły');
  }

  return texture;
}

function traceHex(
  context: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
): void {
  const corners = hexCorners(center, size);
  const first = corners[0];

  if (!first) {
    return;
  }

  context.moveTo(first.x, first.y);

  for (let i = 1; i < corners.length; i += 1) {
    const corner = corners[i];

    if (corner) {
      context.lineTo(corner.x, corner.y);
    }
  }

  context.closePath();
}

export class VisionFog {
  private readonly image: Phaser.GameObjects.Image;
  private readonly texture: Phaser.Textures.CanvasTexture;
  private readonly paintCanvas = document.createElement('canvas');
  private readonly fogTile: CanvasImageSource;
  private readonly tileDisplaySize: number;
  private readonly bounds: FogBounds;
  private readonly cells: readonly FogCell[];
  private visible: ReadonlySet<string> = new Set();
  private explored: ReadonlySet<string> = new Set();

  constructor(
    scene: Phaser.Scene,
    map: GameMap,
    size: number = HEX_SIZE,
  ) {
    this.texture = ensureTexture(scene);
    this.fogTile = fogTileImage(scene);
    this.tileDisplaySize = terrainTileDisplaySize(size);
    const bounds = mapPixelBounds(map, size);
    const margin = Math.max(2, Math.ceil(size * BOUNDS_MARGIN_RATIO));
    const left = Math.floor(bounds?.left ?? 0) - margin;
    const top = Math.floor(bounds?.top ?? 0) - margin;

    this.bounds = {
      left,
      top,
      width: Math.max(1, Math.ceil((bounds?.right ?? left) - left) + margin),
      height: Math.max(1, Math.ceil((bounds?.bottom ?? top) - top) + margin),
    };
    this.cells = Object.keys(map.cells).map((key) => {
      const center = hexToPixel(cellCoord(key), size);

      return {
        key,
        x: center.x - left,
        y: center.y - top,
        rotation: rotationFor(key),
      };
    });
    this.texture.setSize(this.bounds.width, this.bounds.height);
    this.paintCanvas.width = this.bounds.width;
    this.paintCanvas.height = this.bounds.height;
    this.image = scene.add
      .image(this.bounds.left, this.bounds.top, TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDepth(FOG_DEPTH)
      .setDisplaySize(this.bounds.width, this.bounds.height)
      .setVisible(false);
  }

  get objects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.image];
  }

  show(visible: ReadonlySet<string>, explored: ReadonlySet<string>): void {
    this.visible = visible;
    this.explored = explored;
    this.image.setVisible(true);
    this.paint();
  }

  hide(): void {
    this.visible = new Set();
    this.explored = new Set();
    this.image.setVisible(false);
  }

  private paint(): void {
    const paint = this.paintCanvas.getContext('2d');

    if (!paint) {
      return;
    }

    paint.setTransform(1, 0, 0, 1, 0, 0);
    paint.globalCompositeOperation = 'source-over';
    paint.clearRect(0, 0, this.bounds.width, this.bounds.height);
    paint.fillStyle = UNKNOWN_COLOR;
    paint.fillRect(0, 0, this.bounds.width, this.bounds.height);

    paint.globalCompositeOperation = 'destination-out';
    paint.beginPath();

    for (const cell of this.cells) {
      if (this.visible.has(cell.key) || this.explored.has(cell.key)) {
        traceHex(paint, cell, HEX_SIZE + CLEAR_OVERLAP);
      }
    }

    paint.fill();
    paint.globalCompositeOperation = 'source-over';

    for (const cell of this.cells) {
      if (this.visible.has(cell.key) || !this.explored.has(cell.key)) {
        continue;
      }

      const half = this.tileDisplaySize / 2;

      paint.save();
      paint.globalAlpha = FOG_TILE_ALPHA;
      paint.beginPath();
      traceHex(paint, cell, HEX_SIZE + CLEAR_OVERLAP);
      paint.clip();
      paint.translate(cell.x, cell.y);
      paint.rotate(cell.rotation);
      paint.drawImage(this.fogTile, -half, -half, this.tileDisplaySize, this.tileDisplaySize);
      paint.restore();
    }

    const context = this.texture.getContext();
    context.clearRect(0, 0, this.bounds.width, this.bounds.height);
    context.drawImage(this.paintCanvas, 0, 0);
    this.texture.refresh();
  }
}
