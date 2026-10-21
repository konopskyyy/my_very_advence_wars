import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, SCENE_KEYS } from '../theme';
import { MenuButton } from '../ui/MenuButton';
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  HEX_VERTICES,
  HEX_SIZE,
  boardHexAt,
  hexToPixel,
  pixelToHex,
} from '../hexLayout';
import { hexNeighbors, type Hex } from '../core/hex';
import { canMoveTo } from '../core/movement';
import { Terrain, TERRAIN_ART } from '../core/terrain';
import { TANK_START, terrainAt } from '../sampleMap';

const REACHABLE_TINT = 0xd7ff8a;

export class BattlefieldScene extends Phaser.Scene {
  private tankPosition: Hex = { ...TANK_START };
  private tank?: Phaser.GameObjects.Container;
  private coordText?: Phaser.GameObjects.Text;
  private hoverLayer?: Phaser.GameObjects.Graphics;
  private reachableLayer?: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENE_KEYS.battlefield);
  }

  create(): void {
    this.tankPosition = this.startPosition();

    this.drawTiles();
    this.setupCameraBounds();
    this.reachableLayer = this.add.graphics();
    this.hoverLayer = this.add.graphics();
    this.tank = this.createTank();

    const { width, height } = this.scale;
    this.add
      .text(width / 2, 8, 'POLE BITWY — kliknij sąsiedni heks, aby przesunąć czołg', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: COLORS.text,
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    this.coordText = this.add
      .text(6, height - 14, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: COLORS.text,
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(20);

    const menuButton = new MenuButton(this, {
      x: width - 52,
      y: 16,
      width: 88,
      height: 20,
      label: 'MENU',
      onClick: () => this.scene.start(SCENE_KEYS.mainMenu),
    });
    menuButton.setScrollFactor(0);

    this.moveTankTo(this.tankPosition);
    this.refreshReachable();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateHover(pixelToHex(pointer.worldX, pointer.worldY));
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tryMove(pixelToHex(pointer.worldX, pointer.worldY));
    });
  }

  update(_time: number, delta: number): void {
    const camera = this.cameras.main;
    const pointer = this.input.activePointer;
    const { width, height } = this.scale;

    const edgeMargin = 24;
    const scrollSpeed = 420;

    let velocityX = 0;
    let velocityY = 0;

    if (pointer.x <= edgeMargin) {
      velocityX = -1;
    } else if (pointer.x >= width - edgeMargin) {
      velocityX = 1;
    }

    if (pointer.y <= edgeMargin) {
      velocityY = -1;
    } else if (pointer.y >= height - edgeMargin) {
      velocityY = 1;
    }

    if (velocityX !== 0 || velocityY !== 0) {
      const factor = (delta / 1000) * scrollSpeed;
      camera.scrollX += velocityX * factor;
      camera.scrollY += velocityY * factor;
    }
  }

  private setupCameraBounds(): void {
    const tiles = this.boardTiles();
    if (tiles.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const { hex } of tiles) {
      const { x, y } = hexToPixel(hex);
      if (x - HEX_SIZE < minX) minX = x - HEX_SIZE;
      if (x + HEX_SIZE > maxX) maxX = x + HEX_SIZE;
      if (y - HEX_SIZE < minY) minY = y - HEX_SIZE;
      if (y + HEX_SIZE > maxY) maxY = y + HEX_SIZE;
    }

    const padding = 32;
    const worldWidth = maxX - minX + padding * 2;
    const worldHeight = maxY - minY + padding * 2;

    this.cameras.main.setBounds(minX - padding, minY - padding, worldWidth, worldHeight);
    this.cameras.main.centerOn((minX + maxX) / 2, (minY + maxY) / 2);
  }

  private boardTiles(): { hex: Hex; terrain: Terrain }[] {
    const tiles: { hex: Hex; terrain: Terrain }[] = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let q = 0; q < BOARD_COLUMNS; q++) {
        const hex = boardHexAt(q, r);
        const terrain = terrainAt(hex);
        if (terrain === undefined) continue;
        tiles.push({ hex, terrain });
      }
    }
    return tiles;
  }

  private drawTiles(): void {
    const tiles = this.boardTiles();
    const background = this.add.graphics();

    for (const { hex, terrain } of tiles) {
      const points = this.hexPoints(hex);
      background.fillStyle(TERRAIN_ART[terrain].color, 1);
      background.fillPoints(points, true);
    }

    background.lineStyle(1, 0x000000, 0.28);
    for (const { hex } of tiles) {
      background.strokePoints(this.hexPoints(hex), true);
    }

    const details = this.add.graphics();
    for (const { hex, terrain } of tiles) {
      this.drawDetail(details, hex, terrain);
      this.drawCityMark(hex, terrain);
    }
  }

  private drawDetail(graphics: Phaser.GameObjects.Graphics, hex: Hex, terrain: Terrain): void {
    const colors = TERRAIN_ART[terrain].arts.colors;
    const points = this.innerPoints(hex, 0.75);

    colors.forEach((color, index) => {
      graphics.fillStyle(color, 1);
      const point = points[(hex.q + index * 2 + hex.r) % points.length];
      if (!point) return;
      graphics.fillCircle(point.x, point.y, index === 0 ? 2.5 : 1.5);
    });

    if (terrain === Terrain.Water) return;
    this.drawTerrainGlyph(graphics, hex, terrain);
  }

  private drawTerrainGlyph(
    graphics: Phaser.GameObjects.Graphics,
    hex: Hex,
    terrain: Terrain,
  ): void {
    const { x, y } = hexToPixel(hex);
    const seed = hex.q * 7 + hex.r * 13;
    const offsetX = ((seed % 3) - 1) * 3;

    switch (terrain) {
      case Terrain.Forest:
        graphics.fillStyle(0x1d4a2a, 1);
        graphics.fillTriangle(x - 4, y + 4, x + offsetX * 0.2, y - 5, x + 4, y + 4);
        graphics.fillStyle(0x2f6d3d, 1);
        graphics.fillTriangle(x - 3, y + 3, x + 1 + offsetX * 0.3, y - 4, x + 3, y + 3);
        break;
      case Terrain.Mountain:
        graphics.fillStyle(0x57503f, 1);
        graphics.fillTriangle(x - 7, y + 5, x + offsetX, y - 6, x + 7, y + 5);
        graphics.fillStyle(0xb9b3a3, 1);
        graphics.fillTriangle(x + offsetX - 2, y - 1, x + offsetX, y - 6, x + offsetX + 2, y - 1);
        break;
      default:
        break;
    }
  }

  private drawCityMark(hex: Hex, terrain: Terrain): void {
    if (terrain !== Terrain.City) return;

    const { x, y } = hexToPixel(hex);
    const buildings = this.add.graphics();
    buildings.fillStyle(0x9aa0a6, 1);
    buildings.fillRect(x - 7, y - 4, 6, 9);
    buildings.fillRect(x + 1, y - 7, 6, 12);
    buildings.fillStyle(0xd7d9db, 1);
    buildings.fillRect(x - 6, y - 3, 4, 2);
    buildings.fillRect(x + 2, y - 6, 4, 2);
    buildings.fillRect(x + 2, y - 2, 4, 2);
  }

  private updateHover(hex: Hex): void {
    const terrain = terrainAt(hex);
    this.coordText?.setText(
      terrain === undefined
        ? `hex q=${hex.q} r=${hex.r} · poza planszą`
        : `hex q=${hex.q} r=${hex.r} · ${terrain}`,
    );

    this.hoverLayer?.clear();
    const move = canMoveTo(this.tankPosition, hex, terrainAt);
    this.hoverLayer?.lineStyle(2, move.ok ? REACHABLE_TINT : COLORS.windowRed, 0.9);
    this.hoverLayer?.strokePoints(this.hexPoints(hex), true);
  }

  private refreshReachable(): void {
    this.reachableLayer?.clear();

    for (const neighbor of hexNeighbors(this.tankPosition)) {
      if (!canMoveTo(this.tankPosition, neighbor, terrainAt).ok) continue;

      this.reachableLayer?.fillStyle(REACHABLE_TINT, 0.12);
      this.reachableLayer?.fillPoints(this.hexPoints(neighbor), true);
      this.reachableLayer?.lineStyle(1, REACHABLE_TINT, 0.5);
      this.reachableLayer?.strokePoints(this.hexPoints(neighbor), true);
    }
  }

  private tryMove(hex: Hex): void {
    if (!canMoveTo(this.tankPosition, hex, terrainAt).ok) return;

    this.tankPosition = { ...hex };
    this.moveTankTo(hex);
    this.refreshReachable();
    this.updateHover(hex);
  }

  private startPosition(): Hex {
    return terrainAt(TANK_START) ? { ...TANK_START } : boardHexAt(0, 0);
  }

  private moveTankTo(hex: Hex): void {
    const { x, y } = hexToPixel(hex);
    this.tank?.setPosition(x, y);
  }

  private createTank(): Phaser.GameObjects.Container {
    const hull = this.add.graphics();
    hull.fillStyle(0x000000, 0.25);
    hull.fillEllipse(0, 8, 30, 11);
    hull.fillStyle(0x2f2f2f, 1);
    hull.fillRoundedRect(-15, -7, 30, 15, 5);
    hull.fillStyle(0x1f1f1f, 1);
    hull.fillCircle(-8, 8, 4);
    hull.fillCircle(8, 8, 4);

    const turret = this.add.graphics();
    turret.fillStyle(0x5a5a5a, 1);
    turret.fillRoundedRect(-8, -12, 16, 9, 3);
    turret.fillStyle(0x3a3a3a, 1);
    turret.fillRect(3, -11, 20, 3);

    const container = this.add.container(0, 0, [hull, turret]);
    container.setDepth(10);
    return container;
  }

  private hexPoints(hex: Hex): Phaser.Math.Vector2[] {
    const { x, y } = hexToPixel(hex);
    return this.vertices(hex, 1).map(([vx, vy]) => new Phaser.Math.Vector2(x + vx, y + vy));
  }

  private innerPoints(hex: Hex, scale: number): Phaser.Math.Vector2[] {
    const { x, y } = hexToPixel(hex);
    return this.vertices(hex, scale).map(([vx, vy]) => new Phaser.Math.Vector2(x + vx, y + vy));
  }

  private vertices(hex: Hex, scale: number): readonly (readonly [number, number])[] {
    const jitter = 1 + ((hex.q * 7 + hex.r * 13) % 4) * 0.02;
    return HEX_VERTICES.map(([vx, vy]) => [vx * scale * jitter, vy * scale * jitter] as const);
  }
}
