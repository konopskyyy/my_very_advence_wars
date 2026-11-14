import Phaser from 'phaser';
import {
  isMissionCompleted,
  isTileUnlocked,
  prerequisiteTile,
  type Campaign,
  type CampaignTile,
} from '../core/campaign';
import type { ScenarioDefinition } from '../core/scenario';

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

const TILE_FILL = 0x101820;
const TILE_HOVER = 0x17252f;
const TILE_SELECTED = 0x162b21;
const TILE_LOCKED = 0x0c1116;
const TILE_STROKE = 0x2c4437;
const TILE_STROKE_SELECTED = 0x6fd08c;

function statusLabel(preview: boolean, completed: boolean, blocked: boolean): string {
  if (preview) {
    return 'WKRÓTCE';
  }

  if (completed) {
    return 'UKOŃCZONA';
  }

  return blocked ? 'ZABLOKOWANA' : 'GRAJ';
}

function statusColor(preview: boolean, completed: boolean, blocked: boolean): string {
  if (preview) {
    return '#c4a85f';
  }

  if (completed) {
    return '#5fb3d4';
  }

  return blocked ? '#c47b7b' : '#6fd08c';
}

interface TileBackground {
  readonly id: string;
  readonly background: Phaser.GameObjects.Rectangle;
}

export class CampaignTiles {
  private readonly container: Phaser.GameObjects.Container;
  private backgrounds: TileBackground[] = [];
  private status: Phaser.GameObjects.Text | null = null;
  private selected: string | null = null;
  private campaign?: Campaign;
  private completed: ReadonlySet<string> = new Set();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CampaignTilesOptions,
  ) {
    this.container = scene.add.container(0, 0);
  }

  show(campaign: Campaign, completed: ReadonlySet<string> = new Set()): void {
    this.container.removeAll(true);
    this.backgrounds = [];
    this.status = null;
    this.selected = null;
    this.campaign = campaign;
    this.completed = completed;

    const { x, y, width, height } = this.options;

    const title = this.scene.add
      .text(x + PADDING, y + PADDING, campaign.title, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#d8e2dc',
      });
    const description = this.scene.add
      .text(x + PADDING, y + PADDING + 28, campaign.description, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
        wordWrap: { width: width - PADDING * 2 },
      });
    this.container.add([title, description]);

    if (campaign.tiles.length === 0) {
      const empty = this.scene.add
        .text(x + width / 2, y + height / 2, 'Brak misji — kampania w przygotowaniu.', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#7fa08b',
        })
        .setOrigin(0.5);
      this.container.add(empty);
      return;
    }

    const gridTop = y + HEADER_HEIGHT;
    const tileWidth = (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
    const rows = Math.ceil(campaign.tiles.length / COLUMNS);
    const tileHeight = (height - HEADER_HEIGHT - STATUS_SPACE - GAP * (rows - 1)) / rows;

    campaign.tiles.forEach((tile, index) => {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const tileX = x + PADDING + column * (tileWidth + GAP);
      const tileY = gridTop + row * (tileHeight + GAP);

      this.createTile(tile, index, tileX, tileY, tileWidth, tileHeight);
    });

    this.status = this.scene.add
      .text(x + PADDING, y + height - 20, 'Kliknij gotowy kafelek, aby rozpocząć misję.', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7fa08b',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.status);
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

    const number = this.scene.add.text(x + PADDING, y + 16, String(index + 1).padStart(2, '0'), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#6fd08c',
    });
    const title = this.scene.add.text(x + PADDING, y + 38, tile.title, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: width - PADDING * 2 },
    });
    const description = this.scene.add.text(x + PADDING, y + 68, tile.description, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9fb0a5',
      wordWrap: { width: width - PADDING * 2 },
    });
    const preview = tile.mission === undefined;
    const completedMission = isMissionCompleted(tile, this.completed);
    const blocked = !preview && !isTileUnlocked(tile, this.completed);
    const badge = this.scene.add.text(
      x + PADDING,
      y + height - 30,
      statusLabel(preview, completedMission, blocked),
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: statusColor(preview, completedMission, blocked),
      },
    );

    if (blocked) {
      for (const object of [background, number, title, description, badge]) {
        object.setAlpha(0.55);
      }

      background.setFillStyle(TILE_LOCKED, 1);
    }

    background.on('pointerover', () => {
      if (this.selected === tile.id || blocked) {
        return;
      }

      background.setFillStyle(TILE_HOVER, 1);
    });
    background.on('pointerout', () => {
      if (this.selected === tile.id || blocked) {
        return;
      }

      background.setFillStyle(TILE_FILL, 1);
    });
    background.on('pointerdown', () => {
      if (preview) {
        this.select(tile);
        return;
      }

      if (blocked) {
        this.reportBlocked(tile);
        return;
      }

      if (tile.mission) {
        this.options.onLaunch(tile.mission);
      }
    });

    this.backgrounds.push({ id: tile.id, background });
    this.container.add([background, number, title, description, badge]);
  }

  private select(tile: CampaignTile): void {
    this.selected = tile.id;

    for (const entry of this.backgrounds) {
      const isSelected = entry.id === tile.id;

      entry.background.setFillStyle(isSelected ? TILE_SELECTED : TILE_FILL, 1);
      entry.background.setStrokeStyle(1, isSelected ? TILE_STROKE_SELECTED : TILE_STROKE, 1);
    }

    this.status?.setText(`Misja „${tile.title}” jest w przygotowaniu.`);
  }

  private reportBlocked(tile: CampaignTile): void {
    const requirement = this.campaign ? prerequisiteTile(this.campaign, tile) : undefined;
    const title = requirement?.title ?? tile.requiresMission ?? 'wcześniejszą misję';

    this.status?.setText(
      `Misja „${tile.title}” odblokuje się po ukończeniu „${title}”.`,
    );
  }
}
