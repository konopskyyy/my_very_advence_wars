import type Phaser from 'phaser';
import { cellCoord, hexToPixel, type GameMap, type HexCoord } from '../core/map';
import { TERRAIN_DEFS } from '../core/map/terrain';
import { FACTION_DEFS, type Unit } from '../core/units';
import {
  BAR_WIDTH,
  bottomPanels,
  HUD_MARGIN,
  MINIMAP_HEIGHT,
  MINIMAP_PANEL_HEIGHT,
} from './hudLayout';
import { type FactionTheme } from './factionTheme';

const WIDTH = 176;
const HEIGHT = MINIMAP_HEIGHT;
const MARGIN = 12;
const PADDING = 6;
const DEPTH = 30;

export interface MinimapLayout {
  readonly cellSize: number;
  point(coord: HexCoord): { x: number; y: number };
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
  };
}

export interface MinimapState {
  readonly map: GameMap;
  readonly units: readonly Unit[];
  readonly theme: FactionTheme;
  readonly bottomInset: number;
  readonly standalone?: boolean;
  readonly spawn?: HexCoord;
}

export class Minimap {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly stripe: Phaser.GameObjects.Rectangle;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly terrain: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private terrainMap?: GameMap;
  private terrainTop?: number;
  private left = MARGIN;
  private top = 0;
  private panelLeft = MARGIN;
  private panelTop = 0;
  private panelWidth = WIDTH;

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add
      .rectangle(0, 0, WIDTH, MINIMAP_PANEL_HEIGHT, 0x0b0f14, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH - 1);
    this.stripe = scene.add
      .rectangle(0, 0, WIDTH, 2, 0x6fd08c, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
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
    return [
      this.panel,
      this.stripe,
      this.frame,
      this.terrain,
      this.overlay,
      this.title,
    ];
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this.panelLeft &&
      x <= this.panelLeft + this.panelWidth &&
      y >= this.panelTop &&
      y <= this.panelTop + MINIMAP_PANEL_HEIGHT
    );
  }

  update({ map, units, theme, bottomInset, standalone, spawn }: MinimapState): void {
    const isStandalone = standalone === true;
    const panels = bottomPanels(this.scene.scale.width - BAR_WIDTH);

    if (isStandalone) {
      this.panelLeft = MARGIN;
      this.panelTop = this.scene.scale.height - bottomInset - HEIGHT;
      this.panelWidth = WIDTH;
      this.left = this.panelLeft;
      this.top = this.panelTop;
    } else {
      this.panelLeft = panels.minimapLeft;
      this.panelTop = this.scene.scale.height - HUD_MARGIN - MINIMAP_PANEL_HEIGHT;
      this.panelWidth = panels.minimapWidth;
      this.left = this.panelLeft + Math.floor((this.panelWidth - WIDTH) / 2);
      this.top = this.panelTop + 16;
    }

    this.panel
      .setVisible(!isStandalone)
      .setPosition(this.panelLeft, this.panelTop)
      .setSize(this.panelWidth, MINIMAP_PANEL_HEIGHT)
      .setFillStyle(theme.barBackground, 0.82)
      .setStrokeStyle(1, theme.accent, 1);
    this.stripe
      .setVisible(!isStandalone)
      .setPosition(this.panelLeft, this.panelTop)
      .setSize(this.panelWidth, 2)
      .setFillStyle(theme.accent, 1);
    this.title.setColor(theme.accentSoft);
    this.layoutFrame(isStandalone);

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

  }

  private layoutFrame(standalone: boolean): void {
    this.frame.clear();

    if (standalone) {
      this.frame.fillStyle(0x0b0f14, 0.86);
      this.frame.fillRoundedRect(this.left, this.top, WIDTH, HEIGHT, 6);
      this.frame.lineStyle(1, 0x6fd08c, 0.55);
      this.frame.strokeRoundedRect(this.left, this.top, WIDTH, HEIGHT, 6);
    }

    this.title.setPosition(
      standalone ? this.left + 8 : this.panelLeft + 12,
      standalone ? this.top + 4 : this.panelTop + 4,
    );
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
