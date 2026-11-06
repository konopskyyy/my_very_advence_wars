import Phaser from 'phaser';

export interface PortraitColors {
  readonly helmet: number;
  readonly uniform: number;
  readonly weapon: number;
  readonly pack: number;
}

const INK = 0x0b0f14;
const SKIN = 0xd8c3a5;
const BELT = 0x2b2f33;

function fillStrokeRect(
  graphics: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  graphics.fillStyle(color, 1);
  graphics.fillRect(x, y, width, height);
  graphics.lineStyle(2, INK, 1);
  graphics.strokeRect(x, y, width, height);
}

function fillStrokeCircle(
  graphics: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  radius: number,
): void {
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(2, INK, 1);
  graphics.strokeCircle(x, y, radius);
}

export function drawInfantryPortrait(
  graphics: Phaser.GameObjects.Graphics,
  colors: PortraitColors,
): void {
  graphics.clear();

  fillStrokeRect(graphics, colors.pack, -54, -36, 22, 76);
  fillStrokeRect(graphics, colors.uniform, -30, 44, 24, 74);
  fillStrokeRect(graphics, colors.uniform, 6, 44, 24, 74);
  fillStrokeRect(graphics, BELT, -32, 112, 28, 16);
  fillStrokeRect(graphics, BELT, 4, 112, 28, 16);

  fillStrokeRect(graphics, colors.uniform, -36, -44, 72, 92);
  fillStrokeRect(graphics, BELT, -36, 34, 72, 10);

  fillStrokeRect(graphics, colors.uniform, -54, -40, 18, 76);
  fillStrokeRect(graphics, colors.uniform, 36, -40, 18, 76);
  fillStrokeCircle(graphics, SKIN, -45, 40, 8);
  fillStrokeCircle(graphics, SKIN, 45, 40, 8);

  fillStrokeCircle(graphics, SKIN, 0, -58, 20);

  graphics.fillStyle(colors.helmet, 1);
  graphics.fillRoundedRect(-30, -84, 60, 34, 14);
  graphics.lineStyle(2, INK, 1);
  graphics.strokeRoundedRect(-30, -84, 60, 34, 14);
  fillStrokeRect(graphics, colors.helmet, -28, -56, 56, 8);

  graphics.lineStyle(10, INK, 1);
  graphics.beginPath();
  graphics.moveTo(30, -20);
  graphics.lineTo(66, 78);
  graphics.strokePath();
  graphics.lineStyle(6, colors.weapon, 1);
  graphics.beginPath();
  graphics.moveTo(30, -20);
  graphics.lineTo(66, 78);
  graphics.strokePath();
  fillStrokeRect(graphics, colors.weapon, 22, -30, 24, 10);
}
