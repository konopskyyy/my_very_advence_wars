import Phaser from 'phaser';
import { BUILT_IN_MAPS, type MapDefinition } from '../core/map';
import type { GameState } from '../core/state';
import {
  listSavedMaps,
  loadSavedMap,
  type SavedMapSummary,
} from '../storage/maps';
import { formatTimestamp } from '../view/format';
import { createMapCard } from '../view/mapCard';
import { ScrollList } from '../view/scrollList';

const PREVIEW_SIZE = 4;
const TITLE_Y = 30;
const LIST_X = 80;
const LIST_Y = 64;
const LIST_BOTTOM_MARGIN = 56;

export class MapMenuScene extends Phaser.Scene {
  private list!: ScrollList;
  private listWidth = 0;

  constructor() {
    super('map-menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.listWidth = width - LIST_X * 2;
    this.list = new ScrollList(this, {
      x: LIST_X,
      y: LIST_Y,
      width: this.listWidth,
      height: height - LIST_Y - LIST_BOTTOM_MARGIN,
    });

    this.add
      .text(width / 2, TITLE_Y, 'Edytor map', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(width - LIST_X, TITLE_Y, 'Kółko myszy — przewijanie', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      })
      .setOrigin(1, 0.5)
      .setDepth(10);

    this.addNewMapCard();

    for (const definition of BUILT_IN_MAPS) {
      this.addCard(definition);
    }

    void this.addSavedMaps();

    const back = this.add
      .text(width / 2, height - 26, '> Menu główne <', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10)
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

  private addNewMapCard(): void {
    const card = createMapCard(this, {
      title: '> Nowa mapa <',
      description: 'Pusta mapa 22×14 — zacznij od zera',
      width: 360,
      height: 64,
      onOpen: () => this.scene.start('map-editor'),
    });

    this.list.addRow(card.container, card.height, (this.listWidth - card.width) / 2);
  }

  private addCard(definition: MapDefinition): void {
    const draft = this.draftFor(definition);
    const map = draft?.map ?? definition.map;
    const card = createMapCard(this, {
      title: `> ${definition.name} <`,
      description: definition.description,
      map,
      previewSize: PREVIEW_SIZE,
      onOpen: () => {
        this.scene.start('map-editor', {
          definition: { ...definition, map },
          state: draft,
        });
      },
    });

    this.list.addRow(card.container, card.height, (this.listWidth - card.width) / 2);
  }

  private async addSavedMaps(): Promise<void> {
    let maps: SavedMapSummary[];

    try {
      maps = await listSavedMaps();
    } catch (error) {
      console.error('Nie udało się odczytać map z SQLite', error);
      return;
    }

    if (!this.scene.isActive() || maps.length === 0) {
      return;
    }

    this.addSection('ZAPISANE MAPY (SQLite)');

    for (const summary of maps) {
      try {
        const saved = await loadSavedMap(summary.id);

        if (!saved) {
          continue;
        }

        const draft = this.registry.get(`map:draft:${saved.id}`) as GameState | undefined;
        const state = draft ?? saved.state;
        const definition: MapDefinition = {
          id: saved.id,
          name: saved.name,
          description: saved.description || 'Mapa zapisana w edytorze',
          map: state.map,
        };

        const card = createMapCard(this, {
          title: `> ${saved.name} <`,
          description: `${saved.tiles} kafli · ${saved.units} jedn. · ${formatTimestamp(saved.updatedAt)}`,
          width: this.listWidth,
          height: 42,
          textWidth: this.listWidth - 32,
          onOpen: () => this.scene.start('map-editor', { definition, state }),
        });

        this.list.addRow(card.container, card.height);
      } catch (error) {
        console.error(`Nie udało się wczytać mapy ${summary.id}`, error);
      }
    }
  }

  private addSection(label: string): void {
    const container = this.add.container(0, 0);
    const text = this.add
      .text(0, 11, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      })
      .setOrigin(0, 0.5);

    container.add(text);
    this.list.addRow(container, 22);
  }

  private draftFor(definition: MapDefinition): GameState | undefined {
    return this.registry.get(`map:draft:${definition.id}`) as GameState | undefined;
  }
}
