import Phaser from 'phaser';
import { TERRAIN_DEFS, TERRAIN_IDS, type TerrainId } from '../core/terrain';
import {
  FACTION_DEFS,
  UNIT_DEFS,
  UNIT_KINDS,
  type FactionId,
  type UnitKind,
} from '../core/units';
import { createHexSprite } from './hexGrid';
import { createUnitToken, unitTexture, unitTextureKey } from './unitLayer';

const PANEL_X = 0;
const PANEL_Y = 8;
const TILE_WIDTH = 56;
const TILE_HEIGHT = 46;
const TILE_GAP = 2;
const TILE_COLUMNS = 4;
const MENU_PADDING = 8;
const TERRAIN_TOP = PANEL_Y + 94;
const TERRAIN_ROWS = Math.ceil(TERRAIN_IDS.length / TILE_COLUMNS);
const UNIT_LABEL_Y = TERRAIN_TOP + TERRAIN_ROWS * TILE_HEIGHT + 8;
const UNIT_TOP = UNIT_LABEL_Y + 14;
const UNIT_BOTTOM = UNIT_TOP + TILE_HEIGHT;
const FACTION_TOP = UNIT_BOTTOM + 8;
const FACTION_BUTTON_WIDTH = 80;
const FACTION_BUTTON_HEIGHT = 22;
const FACTION_BUTTON_GAP = 4;
const FACTION_BUTTONS_X = PANEL_X + 56;
const SWATCH_RADIUS = 9;

export const EDITOR_PANEL_X = PANEL_X;
export const EDITOR_PANEL_Y = PANEL_Y;
export const EDITOR_PANEL_WIDTH = 250;
export const EDITOR_TERRAIN_LABEL_Y = PANEL_Y + 80;
export const EDITOR_UNIT_LABEL_Y = UNIT_LABEL_Y;
export const EDITOR_FACTION_TOP = FACTION_TOP;
export const EDITOR_FACTION_BUTTON_HEIGHT = FACTION_BUTTON_HEIGHT;
export const EDITOR_HUD_Y = FACTION_TOP + 30;

export type EditorTool = 'terrain' | 'unit';

export interface EditorMenuState {
  readonly tool: EditorTool;
  readonly brush: TerrainId;
  readonly unitKind: UnitKind;
  readonly faction: FactionId;
}

export interface EditorMenuHandlers {
  readonly onTerrain: (terrain: TerrainId) => void;
  readonly onUnit: (kind: UnitKind) => void;
  readonly onFaction: (faction: FactionId) => void;
}

interface TerrainTile {
  readonly terrain: TerrainId;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly swatch: Phaser.GameObjects.Image;
  readonly swatchScaleX: number;
  readonly swatchScaleY: number;
  readonly label: Phaser.GameObjects.Text;
}

interface UnitTile {
  readonly kind: UnitKind;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly token: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

interface FactionButton {
  readonly faction: FactionId;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class EditorMenu {
  private state: EditorMenuState;
  private terrainTiles: TerrainTile[] = [];
  private unitTiles: UnitTile[] = [];
  private factionButtons: FactionButton[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    state: EditorMenuState,
    private readonly handlers: EditorMenuHandlers,
  ) {
    this.state = state;

    this.terrainTiles = TERRAIN_IDS.map((terrain, index) =>
      this.createTerrainTile(terrain, index),
    );
    this.unitTiles = UNIT_KINDS.map((kind, index) => this.createUnitTile(kind, index));

    const factions: FactionId[] = ['blue', 'red'];

    this.factionButtons = factions.map((faction, index) =>
      this.createFactionButton(faction, index),
    );
  }

  refresh(state?: EditorMenuState): void {
    if (state) {
      this.state = state;
    }

    this.terrainTiles.forEach(
      ({ terrain, background, swatch, swatchScaleX, swatchScaleY, label }) => {
        const selected = this.state.tool === 'terrain' && terrain === this.state.brush;
        const factor = selected ? 1.2 : 1;

        this.styleTile(background, selected);
        swatch.setScale(swatchScaleX * factor, swatchScaleY * factor);
        label.setColor(selected ? '#a6f4c5' : '#d8e2dc');
      },
    );

    this.unitTiles.forEach(({ kind, background, token, label }) => {
      const selected = this.state.tool === 'unit' && kind === this.state.unitKind;

      this.styleTile(background, selected);
      unitTexture(this.scene, kind, this.state.faction);
      token.setTexture(unitTextureKey(kind, this.state.faction));
      token.setScale(selected ? 1.1 : 1);
      label.setColor(selected ? '#a6f4c5' : '#d8e2dc');
    });

    this.factionButtons.forEach(({ faction, background, label }) => {
      const selected = this.state.faction === faction;

      background.setFillStyle(selected ? 0x1f3a2a : 0x142018, selected ? 1 : 0.9);
      background.setStrokeStyle(
        selected ? 2 : 1,
        selected ? FACTION_DEFS[faction].color : 0x2a3f33,
        1,
      );
      background.setData('selected', selected);
      label.setColor(selected ? '#ffffff' : '#9fb0a5');
    });
  }

  private createTerrainTile(terrain: TerrainId, index: number): TerrainTile {
    const column = index % TILE_COLUMNS;
    const row = Math.floor(index / TILE_COLUMNS);
    const centerX = this.tileX(column);
    const centerY = this.tileY(TERRAIN_TOP, row);
    const top = centerY - TILE_HEIGHT / 2;
    const background = this.createTileBackground(centerX, centerY);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.handlers.onTerrain(terrain);
    });

    const swatch = createHexSprite(this.scene, terrain, SWATCH_RADIUS);
    const swatchScaleX = swatch.scaleX;
    const swatchScaleY = swatch.scaleY;
    swatch.setPosition(centerX, top + 15);
    swatch.setScrollFactor(0);
    swatch.setDepth(11);

    const label = this.scene.add
      .text(centerX, top + 36, TERRAIN_DEFS[terrain].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { terrain, background, swatch, swatchScaleX, swatchScaleY, label };
  }

  private createUnitTile(kind: UnitKind, index: number): UnitTile {
    const column = index % TILE_COLUMNS;
    const row = Math.floor(index / TILE_COLUMNS);
    const centerX = this.tileX(column);
    const centerY = this.tileY(UNIT_TOP, row);
    const top = centerY - TILE_HEIGHT / 2;
    const background = this.createTileBackground(centerX, centerY);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.handlers.onUnit(kind);
    });

    const token = createUnitToken(this.scene, kind, this.state.faction);
    token.setPosition(centerX, top + 15);
    token.setScrollFactor(0);
    token.setDepth(11);

    const label = this.scene.add
      .text(centerX, top + 36, UNIT_DEFS[kind].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { kind, background, token, label };
  }

  private createFactionButton(faction: FactionId, index: number): FactionButton {
    const centerX =
      FACTION_BUTTONS_X +
      FACTION_BUTTON_WIDTH / 2 +
      index * (FACTION_BUTTON_WIDTH + FACTION_BUTTON_GAP);
    const centerY = FACTION_TOP + FACTION_BUTTON_HEIGHT / 2;
    const background = this.scene.add.rectangle(
      centerX,
      centerY,
      FACTION_BUTTON_WIDTH,
      FACTION_BUTTON_HEIGHT,
      0x142018,
      0.9,
    );

    background.setStrokeStyle(1, 0x2a3f33, 1);
    background.setScrollFactor(0);
    background.setDepth(10.5);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => this.highlightTile(background));
    background.on('pointerout', () => this.refresh());
    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.handlers.onFaction(faction);
    });

    const label = this.scene.add
      .text(centerX, centerY, FACTION_DEFS[faction].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { faction, background, label };
  }

  private createTileBackground(
    centerX: number,
    centerY: number,
  ): Phaser.GameObjects.Rectangle {
    const background = this.scene.add.rectangle(
      centerX,
      centerY,
      TILE_WIDTH,
      TILE_HEIGHT,
      0x142018,
      0.9,
    );

    background.setStrokeStyle(1, 0x2a3f33, 1);
    background.setScrollFactor(0);
    background.setDepth(10.5);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => this.highlightTile(background));
    background.on('pointerout', () => this.refresh());

    return background;
  }

  private tileX(column: number): number {
    return (
      PANEL_X + MENU_PADDING + column * (TILE_WIDTH + TILE_GAP) + TILE_WIDTH / 2
    );
  }

  private tileY(top: number, row: number): number {
    return top + row * TILE_HEIGHT + TILE_HEIGHT / 2;
  }

  private highlightTile(background: Phaser.GameObjects.Rectangle): void {
    if (background.getData('selected') === true) {
      return;
    }

    background.setFillStyle(0x1d2f24, 1);
    background.setStrokeStyle(1, 0x6fbf8f, 1);
  }

  private styleTile(background: Phaser.GameObjects.Rectangle, selected: boolean): void {
    background.setFillStyle(selected ? 0x1f3a2a : 0x142018, selected ? 1 : 0.9);
    background.setStrokeStyle(selected ? 2 : 1, selected ? 0xa6f4c5 : 0x2a3f33, 1);
    background.setData('selected', selected);
  }
}
