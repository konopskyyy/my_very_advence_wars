import Phaser from 'phaser';
import type { GameState } from '../core/state';
import {
  listSavedMaps,
  loadSavedMap,
  type SavedMap,
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

    void this.buildList();

    const createNew = this.add
      .text(width / 2, height - 52, '> Stwórz nową mapę <', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    createNew.on('pointerover', () => createNew.setColor('#a6f4c5'));
    createNew.on('pointerout', () => createNew.setColor('#ffffff'));
    createNew.on('pointerdown', () => this.scene.start('map-editor'));

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

  private async buildList(): Promise<void> {
    if (!this.scene.isActive()) {
      return;
    }

    this.addNewMapCard();

    const savedMaps = await this.loadSavedMaps();

    if (!this.scene.isActive()) {
      return;
    }

    for (const saved of savedMaps) {
      this.addSavedCard(saved);
    }
  }

  private async loadSavedMaps(): Promise<SavedMap[]> {
    const maps: SavedMap[] = [];

    try {
      const summaries = await listSavedMaps();

      for (const summary of summaries) {
        try {
          const saved = await loadSavedMap(summary.id);

          if (saved) {
            maps.push(saved);
          }
        } catch (error) {
          console.error(`Nie udało się wczytać mapy ${summary.id}`, error);
        }
      }
    } catch (error) {
      console.error('Nie udało się odczytać map z SQLite', error);
    }

    return maps;
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

  private addSavedCard(saved: SavedMap): void {
    const draft = this.registry.get(`map:draft:${saved.id}`) as GameState | undefined;
    const state = draft ?? saved.state;
    const definition = {
      id: saved.id,
      name: saved.name,
      description: saved.description || 'Mapa zapisana w edytorze',
      map: state.map,
    };
    const title = draft ? `> ${saved.name} · szkic <` : `> ${saved.name} <`;

    const card = createMapCard(this, {
      title,
      description: `${saved.tiles} kafli · ${saved.units} jedn. · ${formatTimestamp(saved.updatedAt)}`,
      map: state.map,
      previewSize: PREVIEW_SIZE,
      onOpen: () => this.scene.start('map-editor', { definition, state }),
    });

    this.list.addRow(card.container, card.height, (this.listWidth - card.width) / 2);
  }

}
