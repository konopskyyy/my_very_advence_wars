import Phaser from 'phaser';
import { BUILT_IN_MAPS, type MapDefinition } from '../core/map';
import type { GameState } from '../core/state';
import { drawMapPreview, previewLayout } from '../view/mapPreview';

const PREVIEW_SIZE = 4;
const PREVIEW_PADDING = 8;
const CARD_GAP = 10;
const TITLE_Y = 30;
const LIST_Y = 64;
const TEXT_WIDTH = 190;

export class MapMenuScene extends Phaser.Scene {
  constructor() {
    super('map-menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, TITLE_Y, 'Mapy', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    let y = LIST_Y;

    for (const definition of BUILT_IN_MAPS) {
      y += this.addCard(definition, y);
    }

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

  private addCard(definition: MapDefinition, y: number): number {
    const draft = this.draftFor(definition);
    const map = draft?.map ?? definition.map;
    const layout = previewLayout(map, PREVIEW_SIZE, PREVIEW_PADDING);

    const cardWidth = layout.width + PREVIEW_PADDING * 2 + TEXT_WIDTH + 20;
    const cardHeight = Math.max(layout.height + PREVIEW_PADDING * 2, 96);
    const cardX = (this.scale.width - cardWidth) / 2;

    const card = this.add.rectangle(cardX, y, cardWidth, cardHeight, 0x0b0f14, 0.85);
    card.setOrigin(0, 0);
    card.setStrokeStyle(1, 0x3d6b4f, 1);

    drawMapPreview(this, map, PREVIEW_SIZE, {
      x: cardX + layout.origin.x,
      y: y + layout.origin.y,
    });

    const textX = cardX + layout.width + PREVIEW_PADDING * 2;

    const name = this.add
      .text(textX, y + cardHeight / 2 - 18, `> ${definition.name} <`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    const description = this.add
      .text(textX, y + cardHeight / 2 + 10, definition.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
        wordWrap: { width: TEXT_WIDTH },
      })
      .setOrigin(0, 0.5);

    const open = (): void => {
      this.scene.start('map-editor', {
        definition: { ...definition, map },
        state: draft,
      });
    };

    name.on('pointerover', () => name.setColor('#a6f4c5'));
    name.on('pointerout', () => name.setColor('#ffffff'));
    name.on('pointerdown', open);

    description.on('pointerover', () => name.setColor('#a6f4c5'));
    description.on('pointerout', () => name.setColor('#ffffff'));
    description.on('pointerdown', open);

    card.setInteractive({ useHandCursor: true });
    card.on('pointerover', () => name.setColor('#a6f4c5'));
    card.on('pointerout', () => name.setColor('#ffffff'));
    card.on('pointerdown', open);

    return cardHeight + CARD_GAP;
  }

  private draftFor(definition: MapDefinition): GameState | undefined {
    return this.registry.get(`map:draft:${definition.id}`) as GameState | undefined;
  }
}
