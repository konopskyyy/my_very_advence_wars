import Phaser from 'phaser';
import { mapTileCount } from '../core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  type ScenarioDefinition,
} from '../core/scenario';
import { countUnits } from '../core/state';
import {
  listSavedMaps,
  loadSavedMap,
  type SavedMapSummary,
} from '../storage/maps';
import { formatTimestamp } from '../view/format';
import { createMapCard } from '../view/mapCard';
import { ScrollList } from '../view/scrollList';

const PREVIEW_SIZE = 3;
const TITLE_Y = 30;
const LIST_X = 80;
const LIST_Y = 64;
const LIST_BOTTOM_MARGIN = 56;

export class ScenarioMenuScene extends Phaser.Scene {
  private list!: ScrollList;
  private listWidth = 0;

  constructor() {
    super('scenario-menu');
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
      .text(width / 2, TITLE_Y, 'Scenariusze', {
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

    for (const scenario of BUILT_IN_SCENARIOS) {
      this.addCard(scenario);
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

  private addCard(definition: ScenarioDefinition): void {
    const counts = countUnits(definition.state.units);
    const card = createMapCard(this, {
      title: `> ${definition.name} <`,
      description: definition.description,
      meta: `${mapTileCount(definition.state.map)} kafli · ${counts.blue} vs ${counts.red} jednostek`,
      map: definition.state.map,
      previewSize: PREVIEW_SIZE,
      minHeight: 104,
      onOpen: () => this.scene.start('scenario', { definition }),
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

        const state = ensureScenarioArmies(saved.state);
        const counts = countUnits(state.units);
        const definition: ScenarioDefinition = {
          id: saved.id,
          name: saved.name,
          description: saved.description || 'Mapa zapisana w edytorze',
          state,
        };

        const card = createMapCard(this, {
          title: `> ${saved.name} <`,
          description: `${mapTileCount(state.map)} kafli · ${counts.blue} vs ${counts.red} jedn. · ${formatTimestamp(saved.updatedAt)}`,
          width: this.listWidth,
          height: 42,
          textWidth: this.listWidth - 32,
          onOpen: () => this.scene.start('scenario', { definition }),
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
}
