import Phaser from 'phaser';
import { mapTileCount } from '../core/map';
import type { ScenarioDefinition } from '../core/scenario';
import { countUnits, type GameState } from '../core/state';
import { FACTION_DEFS, type FactionId } from '../core/units';
import { drawMapPreview, previewLayout } from './mapPreview';

const DETAIL_X = 450;
const DETAIL_Y = 70;
const DETAIL_WIDTH = 790;
const PREVIEW_SIZE = 4;
const PREVIEW_PADDING = 10;

export interface ScenarioEntry {
  readonly definition: ScenarioDefinition;
  readonly sourceState: GameState;
  readonly meta: string;
}

export interface ScenarioDetailHandlers {
  readonly onEdit: () => void;
  readonly onStart: () => void;
}

export class ScenarioDetailPanel {
  private readonly detailTitle: Phaser.GameObjects.Text;
  private readonly detailDesc: Phaser.GameObjects.Text;
  private readonly detailStats: Phaser.GameObjects.Text;
  private readonly factionBlue: Phaser.GameObjects.Text;
  private readonly factionRed: Phaser.GameObjects.Text;
  private previewSprites: Phaser.GameObjects.Image[] = [];
  private selected: ScenarioEntry | null = null;
  private playerFactionId: FactionId = 'blue';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: ScenarioDetailHandlers,
  ) {
    const panel = this.scene.add.rectangle(
      DETAIL_X,
      DETAIL_Y,
      DETAIL_WIDTH,
      580,
      0x0b0f14,
      0.92,
    );
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(1, 0x3d6b4f, 1);

    this.detailTitle = this.scene.add.text(DETAIL_X + 24, DETAIL_Y + 24, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f2f5f7',
    });

    this.detailDesc = this.scene.add.text(DETAIL_X + 24, DETAIL_Y + 62, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d8e2dc',
      wordWrap: { width: DETAIL_WIDTH - 48 },
      lineSpacing: 2,
    });

    this.detailStats = this.scene.add.text(DETAIL_X + 24, DETAIL_Y + 150, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#9fb0a5',
    });

    this.scene.add.text(
      DETAIL_X + 24,
      DETAIL_Y + 190,
      'Wybierz frakcję, z którą chcesz grać:',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
      },
    );

    this.scene.add.text(DETAIL_X + 24, DETAIL_Y + 220, 'GRAJ JAKO:', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#9fb0a5',
    });

    this.factionBlue = this.scene.add
      .text(DETAIL_X + 24, DETAIL_Y + 246, '> NIEBIESCY <', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setInteractive({ useHandCursor: true });

    this.factionRed = this.scene.add
      .text(DETAIL_X + 150, DETAIL_Y + 246, '> CZERWONI <', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
      })
      .setInteractive({ useHandCursor: true });

    this.factionBlue.on('pointerover', () => {
      if (this.playerFactionId !== 'blue') this.factionBlue.setColor('#a6f4c5');
    });
    this.factionBlue.on('pointerout', () => this.updateFactionButtons());
    this.factionBlue.on('pointerdown', () => {
      this.playerFactionId = 'blue';
      this.updateFactionButtons();
    });

    this.factionRed.on('pointerover', () => {
      if (this.playerFactionId !== 'red') this.factionRed.setColor('#a6f4c5');
    });
    this.factionRed.on('pointerout', () => this.updateFactionButtons());
    this.factionRed.on('pointerdown', () => {
      this.playerFactionId = 'red';
      this.updateFactionButtons();
    });

    this.createButtons();
  }

  get selectedEntry(): ScenarioEntry | null {
    return this.selected;
  }

  get playerFaction(): FactionId {
    return this.playerFactionId;
  }

  select(entry: ScenarioEntry): void {
    this.selected = entry;
    this.playerFactionId = 'blue';
    this.updateFactionButtons();
    this.updateDetail(entry);
  }

  private createButtons(): void {
    const { height } = this.scene.scale;
    const edit = this.scene.add.rectangle(
      DETAIL_X + 24,
      height - 166,
      DETAIL_WIDTH - 48,
      36,
      0x141c22,
      1,
    );
    edit.setOrigin(0, 0);
    edit.setStrokeStyle(1, 0x3d6b4f, 1);
    edit.setInteractive({ useHandCursor: true });

    const editLabel = this.scene.add
      .text(DETAIL_X + DETAIL_WIDTH / 2, height - 148, 'EDYTUJ MAPĘ', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    edit.on('pointerover', () => {
      edit.setFillStyle(0x1c2830, 1);
      editLabel.setColor('#a6f4c5');
    });
    edit.on('pointerout', () => {
      edit.setFillStyle(0x141c22, 1);
      editLabel.setColor('#d8e2dc');
    });
    edit.on('pointerdown', this.handlers.onEdit);

    const start = this.scene.add.rectangle(
      DETAIL_X + 24,
      height - 110,
      DETAIL_WIDTH - 48,
      44,
      0x1f6b45,
      1,
    );
    start.setOrigin(0, 0);
    start.setStrokeStyle(1, 0x6fd08c, 0.8);
    start.setInteractive({ useHandCursor: true });

    this.scene.add
      .text(DETAIL_X + DETAIL_WIDTH / 2, height - 88, 'ROZPOCZNIJ BITWĘ', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    start.on('pointerover', () => start.setFillStyle(0x2b8a5b, 1));
    start.on('pointerout', () => start.setFillStyle(0x1f6b45, 1));
    start.on('pointerdown', this.handlers.onStart);
  }

  private updateFactionButtons(): void {
    this.factionBlue.setColor(this.playerFactionId === 'blue' ? '#ffffff' : '#9fb0a5');
    this.factionRed.setColor(this.playerFactionId === 'red' ? '#ffffff' : '#9fb0a5');
  }

  private updateDetail(entry: ScenarioEntry): void {
    const map = entry.definition.state.map;
    const counts = countUnits(entry.definition.state.units);
    const tiles = mapTileCount(map);

    this.detailTitle.setText(entry.definition.name);
    this.detailDesc.setText(entry.definition.description);
    this.detailStats.setText(
      `Rozmiar mapy: ${tiles} kafli\nJednostki: ${counts.blue} niebieskich · ${counts.red} czerwonych\nGracz: ${FACTION_DEFS[this.playerFactionId].label}`,
    );

    for (const sprite of this.previewSprites) {
      sprite.destroy();
    }
    this.previewSprites.length = 0;

    const areaWidth = DETAIL_WIDTH - 48;
    const areaHeight = 150;
    let previewSize = PREVIEW_SIZE;
    let layout = previewLayout(map, previewSize, PREVIEW_PADDING);

    while (
      previewSize > 1 &&
      (layout.width > areaWidth || layout.height > areaHeight)
    ) {
      previewSize -= 0.5;
      layout = previewLayout(map, previewSize, PREVIEW_PADDING);
    }

    const left = DETAIL_X + 24 + Math.max(0, (areaWidth - layout.width) / 2);
    const top = DETAIL_Y + 320;

    this.previewSprites = drawMapPreview(this.scene, map, previewSize, layout.origin);
    for (const sprite of this.previewSprites) {
      sprite.setPosition(sprite.x + left, sprite.y + top);
      sprite.setDepth(2);
      this.scene.add.existing(sprite);
    }
  }
}
