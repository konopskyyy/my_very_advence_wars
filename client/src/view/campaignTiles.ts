import Phaser from 'phaser';
import type { Campaign, CampaignTile } from '../core/campaign';
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
const TILE_STROKE = 0x2c4437;
const TILE_STROKE_SELECTED = 0x6fd08c;

interface TileBackground {
  readonly id: string;
  readonly background: Phaser.GameObjects.Rectangle;
}

export class CampaignTiles {
  private readonly container: Phaser.GameObjects.Container;
  private backgrounds: TileBackground[] = [];
  private status: Phaser.GameObjects.Text | null = null;
  private selected: string | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CampaignTilesOptions,
  ) {
    this.container = scene.add.container(0, 0);
  }

  show(campaign: Campaign): void {
    this.container.removeAll(true);
    this.backgrounds = [];
    this.status = null;
    this.selected = null;

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
    const ready = tile.mission !== undefined;
    const badge = this.scene.add.text(
      x + PADDING,
      y + height - 30,
      ready ? 'GRAJ' : 'WKRÓTCE',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: ready ? '#6fd08c' : '#c4a85f',
      },
    );

    background.on('pointerover', () => {
      if (this.selected === tile.id) {
        return;
      }

      background.setFillStyle(TILE_HOVER, 1);
    });
    background.on('pointerout', () => {
      if (this.selected === tile.id) {
        return;
      }

      background.setFillStyle(TILE_FILL, 1);
    });
    background.on('pointerdown', () => {
      if (tile.mission) {
        this.options.onLaunch(tile.mission);
        return;
      }

      this.select(tile);
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
}
