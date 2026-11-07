import Phaser from 'phaser';
import { hexToPixel, type HexCoord } from '../core/map';
import {
  FACTION_DEFS,
  type FactionId,
  type Unit,
  type UnitKind,
} from '../core/units';
import { colorToCss, HEX_SIZE } from './hexGrid';

export const UNIT_TOKEN_SIZE = 26;

const textureCache = new Map<string, Phaser.Textures.CanvasTexture>();
const INK = 'rgba(11, 15, 20, 0.92)';
const LIGHT = '#f2f5f7';

export function unitTextureKey(kind: UnitKind, faction: FactionId): string {
  return `unit-${faction}-${kind}`;
}

export function unitTexture(
  scene: Phaser.Scene,
  kind: UnitKind,
  faction: FactionId,
): Phaser.Textures.CanvasTexture {
  const key = unitTextureKey(kind, faction);
  const cached = textureCache.get(key);

  if (cached) {
    return cached;
  }

  if (scene.textures.exists(key)) {
    const existing = scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    textureCache.set(key, existing);
    return existing;
  }

  const texture = scene.textures.createCanvas(key, UNIT_TOKEN_SIZE, UNIT_TOKEN_SIZE);

  if (!texture) {
    throw new Error('nie udało się utworzyć tekstury jednostki');
  }

  const context = texture.getContext();
  const center = UNIT_TOKEN_SIZE / 2;
  const radius = center - 1;
  const factionColor = colorToCss(FACTION_DEFS[faction].color);

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.fillStyle = factionColor;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = INK;
  context.stroke();

  drawUnitIcon(context, kind, factionColor);

  texture.refresh();
  textureCache.set(key, texture);

  return texture;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawUnitIcon(
  context: CanvasRenderingContext2D,
  kind: UnitKind,
  factionColor: string,
): void {
  context.save();
  context.fillStyle = INK;
  context.strokeStyle = INK;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  switch (kind) {
    case 'infantry':
      drawSoldier(context, factionColor);
      break;
    case 'tank':
      drawTank(context, factionColor);
      break;
    case 'artillery':
      drawArtillery(context, factionColor);
      break;
    case 'scout':
      drawScout(context, factionColor);
      break;
  }

  context.restore();
}

function drawSoldier(context: CanvasRenderingContext2D, factionColor: string): void {
  context.fillRect(9, 15, 3, 8);
  context.fillRect(14, 15, 3, 8);
  context.fillRect(8, 9, 10, 8);
  context.fillRect(6, 10, 2, 6);
  context.fillRect(18, 10, 2, 6);

  context.beginPath();
  context.arc(13, 6.5, 3.5, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(13, 6.5, 4.5, Math.PI, 0);
  context.fill();

  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(17, 17);
  context.lineTo(22, 6);
  context.stroke();

  context.fillStyle = factionColor;
  context.fillRect(10, 2.5, 6, 1.5);
}

function drawTank(context: CanvasRenderingContext2D, factionColor: string): void {
  roundedRect(context, 3, 15, 20, 8, 3);
  context.fill();
  roundedRect(context, 4, 11, 18, 6, 2);
  context.fill();
  roundedRect(context, 8, 6, 9, 6, 2);
  context.fill();
  context.fillRect(16, 8, 8, 2.5);

  context.fillStyle = factionColor;
  for (const x of [8, 13, 18]) {
    context.beginPath();
    context.arc(x, 19, 1.6, 0, Math.PI * 2);
    context.fill();
  }
  context.fillRect(10, 7.5, 5, 1);
}

function drawArtillery(context: CanvasRenderingContext2D, factionColor: string): void {
  context.beginPath();
  context.moveTo(13, 12);
  context.lineTo(4, 23);
  context.lineTo(22, 23);
  context.closePath();
  context.fill();

  context.beginPath();
  context.arc(9, 19, 4, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(17, 19, 4, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(13, 13);
  context.rotate(-Math.PI / 5);
  context.fillRect(-1.5, -12, 4, 14);
  context.restore();

  context.fillRect(9, 11, 8, 5);

  context.fillStyle = factionColor;
  context.beginPath();
  context.arc(9, 19, 1.5, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(17, 19, 1.5, 0, Math.PI * 2);
  context.fill();
}

function drawScout(context: CanvasRenderingContext2D, factionColor: string): void {
  roundedRect(context, 4, 11, 18, 7, 2);
  context.fill();

  context.beginPath();
  context.moveTo(7, 11);
  context.lineTo(9, 6);
  context.lineTo(15, 6);
  context.lineTo(17, 11);
  context.closePath();
  context.fill();

  context.beginPath();
  context.arc(8, 20, 3, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(18, 20, 3, 0, Math.PI * 2);
  context.fill();

  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(18, 10);
  context.lineTo(21, 3);
  context.stroke();

  context.fillStyle = factionColor;
  context.fillRect(10, 7.5, 4, 2.5);

  context.fillStyle = LIGHT;
  context.beginPath();
  context.arc(21, 14, 1.4, 0, Math.PI * 2);
  context.fill();
}

export function createUnitToken(
  scene: Phaser.Scene,
  kind: UnitKind,
  faction: FactionId,
): Phaser.GameObjects.Image {
  unitTexture(scene, kind, faction);

  return scene.add.image(0, 0, unitTextureKey(kind, faction));
}

export class UnitLayer {
  private readonly tokens = new Map<string, Phaser.GameObjects.Image>();
  private readonly positions = new Map<string, HexCoord>();

  private units: readonly Unit[];

  constructor(
    private readonly scene: Phaser.Scene,
    units: readonly Unit[],
    readonly size: number = HEX_SIZE,
  ) {
    this.units = units;
    this.sync();
  }

  get unitCount(): number {
    return this.tokens.size;
  }

  getToken(unitId: string): Phaser.GameObjects.Image | undefined {
    return this.tokens.get(unitId);
  }

  objects(): Phaser.GameObjects.Image[] {
    return [...this.tokens.values()];
  }

  setUnits(units: readonly Unit[], animate = true): void {
    this.units = units;
    this.sync(animate);
  }

  center(coord: HexCoord): { x: number; y: number } {
    return hexToPixel(coord, this.size);
  }

  destroy(): void {
    for (const token of this.tokens.values()) {
      token.destroy();
    }

    this.tokens.clear();
    this.positions.clear();
  }

  private sync(animate = true): void {
    const unitsById = new Map<string, Unit>();

    for (const unit of this.units) {
      unitsById.set(unit.id, unit);
    }

    for (const [id, token] of this.tokens) {
      const unit = unitsById.get(id);

      if (unit && token.texture.key === unitTextureKey(unit.kind, unit.faction)) {
        continue;
      }

      token.destroy();
      this.tokens.delete(id);
      this.positions.delete(id);
    }

    for (const unit of this.units) {
      let token = this.tokens.get(unit.id);

      if (!token) {
        token = createUnitToken(this.scene, unit.kind, unit.faction);
        token.setDepth(2);
        this.tokens.set(unit.id, token);
        this.positions.set(unit.id, unit.pos);
        const center = this.center(unit.pos);
        token.setPosition(center.x, center.y);
        continue;
      }

      const prev = this.positions.get(unit.id);
      const center = this.center(unit.pos);

      if (!prev || prev.col !== unit.pos.col || prev.row !== unit.pos.row) {
        if (animate) {
          this.animateMove(token, center.x, center.y);
        }
        this.positions.set(unit.id, unit.pos);
      } else {
        token.setPosition(center.x, center.y);
      }
    }
  }

  private animateMove(token: Phaser.GameObjects.Image, x: number, y: number): void {
    this.scene.tweens.killTweensOf(token);
    this.scene.tweens.add({
      targets: token,
      x,
      y,
      duration: 250,
      ease: 'Cubic.easeOut',
    });
  }
}
