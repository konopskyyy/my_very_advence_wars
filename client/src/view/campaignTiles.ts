import Phaser from 'phaser';
import {
  isMissionCompleted,
  tileStatus,
  type Campaign,
  type CampaignTile,
} from '../core/campaign';
import type { ScenarioDefinition } from '../core/scenario';
import { FACTION_THEMES } from './factionTheme';

export interface CampaignTilesOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly onLaunch: (mission: ScenarioDefinition) => void;
}

const PADDING = 24;
const HEADER_HEIGHT = 88;
const STATUS_SPACE = 46;
const COLUMNS = 3;
const GAP = 16;
const MIN_TILE_HEIGHT = 152;
const SCROLLBAR_WIDTH = 4;
const SCROLLBAR_MIN_THUMB = 32;
const WHEEL_STEP = 56;

const theme = FACTION_THEMES.blue;
const TILE_FILL = 0x111826;
const TILE_HOVER = theme.accentDark;
const TILE_STROKE = theme.divider;

interface TileEntry {
  readonly top: number;
  readonly height: number;
  readonly objects: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible)[];
}

function isActive(tile: CampaignTile, completed: ReadonlySet<string>): boolean {
  const status = tileStatus(tile, completed);

  return status === 'ready' || status === 'completed';
}

export class CampaignTiles {
  private readonly container: Phaser.GameObjects.Container;
  private readonly grid: Phaser.GameObjects.Container;
  private readonly scrollbar: Phaser.GameObjects.Graphics;
  private readonly mask: Phaser.Display.Masks.GeometryMask;
  private tiles: TileEntry[] = [];
  private status: Phaser.GameObjects.Text | null = null;
  private completed: ReadonlySet<string> = new Set();
  private scroll = 0;
  private contentHeight = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CampaignTilesOptions,
  ) {
    const { x, y, width, height } = options;
    const viewportTop = y + HEADER_HEIGHT;
    const viewportHeight = height - HEADER_HEIGHT - STATUS_SPACE;

    this.container = scene.add.container(0, 0);
    this.grid = scene.add.container(0, 0);

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(x, viewportTop, width, viewportHeight);
    this.mask = maskShape.createGeometryMask();
    this.grid.setMask(this.mask);

    this.scrollbar = scene.add.graphics();

    scene.input.on('wheel', this.onWheel, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('wheel', this.onWheel, this);
      this.mask.destroy();
    });
  }

  show(campaign: Campaign, completed: ReadonlySet<string> = new Set()): void {
    this.container.removeAll(true);
    this.grid.removeAll(true);
    this.tiles = [];
    this.status = null;
    this.completed = completed;
    this.scroll = 0;
    this.contentHeight = 0;

    const { x, y, width, height } = this.options;

    const title = this.scene.add
      .text(x + PADDING, y + PADDING, campaign.title, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#e8eef5',
      })
      .setLetterSpacing(2);
    this.container.add(title);

    const tiles = campaign.tiles.filter((tile) => isActive(tile, completed));

    if (tiles.length === 0) {
      const message =
        campaign.tiles.length === 0
          ? 'Brak misji — kampania w przygotowaniu.'
          : 'Ukończ poprzednie misje, aby odblokować kolejne.';
      const empty = this.scene.add
        .text(x + width / 2, y + height / 2, message, {
          fontFamily: 'Trebuchet MS, Verdana, sans-serif',
          fontSize: '14px',
          color: '#8fa3b8',
        })
        .setOrigin(0.5);
      this.container.add(empty);
      this.refresh();
      return;
    }

    const viewportTop = y + HEADER_HEIGHT;
    const viewportHeight = height - HEADER_HEIGHT - STATUS_SPACE;
    const tileWidth = (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
    const rows = Math.ceil(tiles.length / COLUMNS);
    const available = viewportHeight - GAP * (rows - 1);
    const tileHeight = Math.max(MIN_TILE_HEIGHT, available / rows);

    tiles.forEach((tile, index) => {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const tileX = x + PADDING + column * (tileWidth + GAP);
      const tileY = viewportTop + row * (tileHeight + GAP);

      this.createTile(tile, index, tileX, tileY, tileWidth, tileHeight);
    });

    this.contentHeight = rows * tileHeight + GAP * (rows - 1);

    this.status = this.scene.add
      .text(x + PADDING, y + height - 20, 'Kliknij kafelek, aby rozpocząć misję.', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#6b7d90',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.status);

    this.refresh();
  }

  private createTile(
    tile: CampaignTile,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const background = this.scene.add
      .rectangle(x, y, width, height, TILE_FILL, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, TILE_STROKE, 1)
      .setInteractive({ useHandCursor: true });

    const number = this.scene.add
      .text(x + PADDING, y + 16, String(index + 1).padStart(2, '0'), {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: theme.accentSoft,
      })
      .setLetterSpacing(2);
    const title = this.scene.add.text(x + PADDING, y + 38, tile.title, {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#e8eef5',
      wordWrap: { width: width - PADDING * 2 },
    });
    const completed = isMissionCompleted(tile, this.completed);
    const badge = this.scene.add
      .text(x + PADDING, y + height - 30, completed ? 'UKOŃCZONA' : 'GRAJ', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: completed ? theme.accentSoft : '#a6f4c5',
      })
      .setLetterSpacing(1);

    background.on('pointerover', () => {
      background.setFillStyle(TILE_HOVER, 1);
    });
    background.on('pointerout', () => {
      background.setFillStyle(TILE_FILL, 1);
    });
    background.on('pointerdown', () => {
      if (tile.mission) {
        this.options.onLaunch(tile.mission);
      }
    });

    this.tiles.push({ top: y, height, objects: [background, number, title, badge] });
    this.grid.add([background, number, title, badge]);
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    const { x, y, width, height } = this.options;
    const viewportTop = y + HEADER_HEIGHT;
    const viewportHeight = height - HEADER_HEIGHT - STATUS_SPACE;

    if (
      this.contentHeight <= viewportHeight ||
      pointer.x < x ||
      pointer.x > x + width ||
      pointer.y < viewportTop ||
      pointer.y > viewportTop + viewportHeight
    ) {
      return;
    }

    this.scrollBy(deltaY > 0 ? WHEEL_STEP : -WHEEL_STEP);
  }

  private scrollBy(amount: number): void {
    const viewportHeight = this.options.height - HEADER_HEIGHT - STATUS_SPACE;
    const maxScroll = Math.max(0, this.contentHeight - viewportHeight);

    this.scroll = Phaser.Math.Clamp(this.scroll + amount, 0, maxScroll);
    this.refresh();
  }

  private refresh(): void {
    const { y, height } = this.options;
    const viewportTop = y + HEADER_HEIGHT;
    const viewportHeight = height - HEADER_HEIGHT - STATUS_SPACE;
    const maxScroll = Math.max(0, this.contentHeight - viewportHeight);

    this.scroll = Phaser.Math.Clamp(this.scroll, 0, maxScroll);
    this.grid.setY(-this.scroll);

    for (const tile of this.tiles) {
      const top = tile.top - this.scroll;
      const visible = top < viewportTop + viewportHeight && top + tile.height > viewportTop;

      for (const object of tile.objects) {
        object.setVisible(visible);
      }
    }

    this.drawScrollbar(maxScroll, viewportTop, viewportHeight);
  }

  private drawScrollbar(maxScroll: number, viewportTop: number, viewportHeight: number): void {
    this.scrollbar.clear();

    if (maxScroll <= 0) {
      return;
    }

    const trackX = this.options.x + this.options.width - PADDING + 8;
    const thumbHeight = Math.max(
      SCROLLBAR_MIN_THUMB,
      (viewportHeight / this.contentHeight) * viewportHeight,
    );
    const thumbY = viewportTop + (this.scroll / maxScroll) * (viewportHeight - thumbHeight);

    this.scrollbar.fillStyle(theme.divider, 0.9);
    this.scrollbar.fillRect(trackX, viewportTop, SCROLLBAR_WIDTH, viewportHeight);
    this.scrollbar.fillStyle(theme.accentBright, 0.9);
    this.scrollbar.fillRect(trackX, thumbY, SCROLLBAR_WIDTH, thumbHeight);
  }
}
