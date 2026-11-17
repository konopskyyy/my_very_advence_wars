import Phaser from 'phaser';
import {
  isMissionCompleted,
  isTileUnlocked,
  prerequisiteTile,
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

const theme = FACTION_THEMES.blue;
const TILE_FILL = 0x111826;
const TILE_HOVER = theme.accentDark;
const TILE_SELECTED = theme.accentDark;
const TILE_LOCKED = theme.barBackground;
const TILE_STROKE = theme.divider;
const TILE_STROKE_SELECTED = theme.accentBright;

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
    return theme.accentSoft;
  }

  return blocked ? FACTION_THEMES.red.accentSoft : '#a6f4c5';
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
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#e8eef5',
      })
      .setLetterSpacing(2);
    const description = this.scene.add
      .text(x + PADDING, y + PADDING + 30, campaign.description, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        color: '#8fa3b8',
        wordWrap: { width: width - PADDING * 2 },
      });
    this.container.add([title, description]);

    if (campaign.tiles.length === 0) {
      const empty = this.scene.add
        .text(x + width / 2, y + height / 2, 'Brak misji — kampania w przygotowaniu.', {
          fontFamily: 'Trebuchet MS, Verdana, sans-serif',
          fontSize: '14px',
          color: '#8fa3b8',
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
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#6b7d90',
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
    const description = this.scene.add.text(x + PADDING, y + 68, tile.description, {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '12px',
      color: '#8fa3b8',
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
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: statusColor(preview, completedMission, blocked),
      },
    ).setLetterSpacing(1);

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
