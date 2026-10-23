import Phaser from 'phaser';
import { BUILT_IN_SCENARIOS, type ScenarioDefinition } from '../core/scenario';
import { listSavedMaps, loadSavedMap, type SavedMap, type SavedMapSummary } from '../storage/maps';
import { drawMapPreview, previewLayout } from '../view/mapPreview';

const PREVIEW_SIZE = 3;
const PREVIEW_PADDING = 8;
const CARD_GAP = 10;
const TITLE_Y = 30;
const LIST_Y = 64;
const TEXT_WIDTH = 220;
const SAVED_MAP_LIMIT = 6;
const SAVED_ROW_HEIGHT = 42;

export class ScenarioMenuScene extends Phaser.Scene {
  private nextY = LIST_Y;

  constructor() {
    super('scenario-menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.nextY = LIST_Y;

    this.add
      .text(width / 2, TITLE_Y, 'Scenariusze', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    for (const scenario of BUILT_IN_SCENARIOS) {
      this.addCard(scenario, this.nextY);
    }

    void this.addSavedMaps();

    const back = this.add
      .text(width / 2, height - 26, '> Menu główne <', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setColor('#a6f4c5'));
    back.on('pointerout', () => back.setColor('#ffffff'));
    back.on('pointerdown', () => this.scene.start('menu'));

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.scene.start('menu');
      }
    });
  }

  private async addSavedMaps(): Promise<void> {
    let maps: SavedMapSummary[];

    try {
      maps = await listSavedMaps();
    } catch (error) {
      console.error('Nie udało się odczytać map z SQLite', error);
      return;
    }

    if (!this.scene.isActive()) {
      return;
    }

    if (maps.length === 0) {
      return;
    }

    this.add
      .text(80, this.nextY + 4, 'ZAPISANE MAPY (SQLite)', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      })
      .setOrigin(0, 0.5);

    this.nextY += 24;

    for (const summary of maps.slice(0, SAVED_MAP_LIMIT)) {
      try {
        const saved = await loadSavedMap(summary.id);

        if (!saved) {
          continue;
        }

        this.addSavedRow(saved, this.nextY);
      } catch (error) {
        console.error(`Nie udało się wczytać mapy ${summary.id}`, error);
      }
    }

    if (maps.length > SAVED_MAP_LIMIT) {
      this.add
        .text(
          this.scale.width / 2,
          this.nextY,
          `Pozostałe ${maps.length - SAVED_MAP_LIMIT} mapy są w menu edytora`,
          {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#9fb0a5',
          },
        )
        .setOrigin(0.5, 0);
    }
  }

  private addSavedRow(saved: SavedMap, y: number): void {
    const cardX = 80;
    const cardWidth = this.scale.width - cardX * 2;
    const background = this.add.rectangle(cardX, y, cardWidth, SAVED_ROW_HEIGHT, 0x0b0f14, 0.85);

    background.setOrigin(0, 0);
    background.setStrokeStyle(1, 0x3d6b4f, 1);
    background.setInteractive({ useHandCursor: true });

    const name = this.add
      .text(cardX + 16, y + 13, `> ${saved.name} <`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(
        cardX + 16,
        y + 30,
        `${saved.tiles} kafli · ${saved.units} jedn. · ${formatDate(saved.updatedAt)}`,
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        },
      )
      .setOrigin(0, 0.5);

    const open = (): void => {
      this.scene.start('scenario', {
        definition: {
          id: saved.id,
          name: saved.name,
          description: saved.description || 'Mapa zapisana w edytorze',
          state: saved.state,
        },
      });
    };

    background.on('pointerover', () => name.setColor('#a6f4c5'));
    background.on('pointerout', () => name.setColor('#ffffff'));
    background.on('pointerdown', open);
    name.setInteractive({ useHandCursor: true });
    name.on('pointerover', () => name.setColor('#a6f4c5'));
    name.on('pointerout', () => name.setColor('#ffffff'));
    name.on('pointerdown', open);

    this.nextY += SAVED_ROW_HEIGHT + 6;
  }

  private addCard(definition: ScenarioDefinition, y: number): void {
    const map = definition.state.map;
    const layout = previewLayout(map, PREVIEW_SIZE, PREVIEW_PADDING);
    const cardWidth = layout.width + PREVIEW_PADDING * 2 + TEXT_WIDTH + 20;
    const cardHeight = Math.max(layout.height + PREVIEW_PADDING * 2, 104);
    const cardX = (this.scale.width - cardWidth) / 2;

    const card = this.add.rectangle(cardX, y, cardWidth, cardHeight, 0x0b0f14, 0.85);
    card.setOrigin(0, 0);
    card.setStrokeStyle(1, 0x3d6b4f, 1);

    drawMapPreview(this, map, PREVIEW_SIZE, {
      x: cardX + layout.origin.x,
      y: y + layout.origin.y,
    });

    const textX = cardX + layout.width + PREVIEW_PADDING * 2;
    const blue = definition.state.units.filter((unit) => unit.faction === 'blue').length;
    const red = definition.state.units.filter((unit) => unit.faction === 'red').length;

    const name = this.add
      .text(textX, y + 28, `> ${definition.name} <`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    const description = this.add
      .text(textX, y + 52, definition.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
        wordWrap: { width: TEXT_WIDTH },
      })
      .setOrigin(0, 0);

    this.add
      .text(
        textX,
        y + cardHeight - 16,
        `${Object.keys(map.cells).length} kafli · ${blue} vs ${red} jednostek`,
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#7fa08b',
        },
      )
      .setOrigin(0, 0.5);

    const open = (): void => {
      this.scene.start('scenario', { definition });
    };

    for (const target of [card, name, description]) {
      target.setInteractive({ useHandCursor: true });
      target.on('pointerover', () => name.setColor('#a6f4c5'));
      target.on('pointerout', () => name.setColor('#ffffff'));
      target.on('pointerdown', open);
    }

    this.nextY += cardHeight + CARD_GAP;
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('pl-PL');
}
