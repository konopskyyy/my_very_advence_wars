import Phaser from 'phaser';
import { mapTileCount } from '../core/map';
import { ensureScenarioArmies, type ScenarioDefinition } from '../core/scenario';
import { countUnits } from '../core/state';
import {
  listSavedMaps,
  loadSavedMap,
  type SavedMapSummary,
} from '../storage/maps';
import { formatTimestamp } from '../view/format';
import { ScenarioDetailPanel, type ScenarioEntry } from '../view/scenarioDetailPanel';
import { ScrollList } from '../view/scrollList';

const TITLE_Y = 30;
const LIST_X = 40;
const LIST_Y = 70;
const LIST_BOTTOM_MARGIN = 70;
const LIST_WIDTH = 380;

export class ScenarioMenuScene extends Phaser.Scene {
  private list!: ScrollList;
  private entries: ScenarioEntry[] = [];
  private listItems: Phaser.GameObjects.GameObject[] = [];
  private detail!: ScenarioDetailPanel;

  private selected: ScenarioEntry | null = null;
  private loadToken = 0;

  constructor() {
    super('scenario-menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.entries = [];
    this.listItems = [];
    this.selected = null;
    const token = ++this.loadToken;

    this.add
      .text(width / 2, TITLE_Y, 'Scenariusze', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.list = new ScrollList(this, {
      x: LIST_X,
      y: LIST_Y,
      width: LIST_WIDTH,
      height: height - LIST_Y - LIST_BOTTOM_MARGIN,
    });

    this.detail = new ScenarioDetailPanel(this, {
      onEdit: () => this.editSelectedMap(),
      onStart: () => this.startBattle(),
    });

    void this.addSavedEntries(token);

    this.renderList();

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

  private async addSavedEntries(token: number): Promise<void> {
    let maps: SavedMapSummary[];

    try {
      maps = await listSavedMaps();
    } catch (error) {
      console.error('Nie udało się odczytać map z SQLite', error);
      return;
    }

    if (!this.scene.isActive() || token !== this.loadToken) {
      return;
    }

    const seen = new Set(this.entries.map((entry) => entry.definition.id));

    for (const summary of maps) {
      if (token !== this.loadToken) {
        return;
      }

      if (seen.has(summary.id)) {
        continue;
      }

      try {
        const saved = await loadSavedMap(summary.id);

        if (!saved) {
          continue;
        }

        const tileCount = mapTileCount(saved.state.map);

        if (tileCount < 16) {
          continue;
        }

        const state = ensureScenarioArmies(saved.state);
        const counts = countUnits(state.units);

        if (counts.blue === 0 || counts.red === 0) {
          continue;
        }

        const definition: ScenarioDefinition = {
          id: saved.id,
          name: saved.name,
          description: saved.description || 'Mapa zapisana w edytorze',
          state,
        };

        this.entries.push({
          definition,
          sourceState: saved.state,
          meta: `${mapTileCount(state.map)} kafli · ${counts.blue} vs ${counts.red} jednostek · ${formatTimestamp(saved.updatedAt)}`,
        });
        seen.add(saved.id);
      } catch (error) {
        console.error(`Nie udało się wczytać mapy ${summary.id}`, error);
      }
    }

    if (token !== this.loadToken) {
      return;
    }

    this.renderList();
    if (this.selected) {
      this.detail.select(this.selected);
    }
  }

  private renderList(): void {
    for (const item of this.listItems) {
      item.destroy();
    }
    this.listItems.length = 0;

    this.list.clear();

    if (this.entries.length > 0) {
      this.addListHeader('WYBIERZ SCENARIUSZ');
      for (const entry of this.entries) {
        this.addListItem(entry);
      }
    } else {
      this.addListHeader('BRAK SCENARIUSZY');
    }

    if (this.entries.length > 0 && !this.selected) {
      this.selectEntry(this.entries[0]!);
    }
  }

  private addListHeader(label: string): void {
    const container = this.add.container(0, 0);
    const text = this.add
      .text(0, 11, label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setOrigin(0, 0.5);

    container.add(text);
    this.listItems.push(container);
    this.list.addRow(container, 22);
  }

  private addListItem(entry: ScenarioEntry): void {
    const container = this.add.container(0, 0);
    const background = this.add.rectangle(0, 0, LIST_WIDTH - 12, 46, 0x0b0f14, 0.9);
    background.setOrigin(0, 0);
    background.setStrokeStyle(1, 0x2a3f33, 1);
    background.setInteractive({ useHandCursor: true });

    const title = this.add
      .text(10, 14, entry.definition.name, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setOrigin(0, 0.5);

    const meta = this.add
      .text(10, 32, entry.meta, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#7fa08b',
      })
      .setOrigin(0, 0.5);

    container.add([background, title, meta]);
    this.listItems.push(container);

    background.on('pointerover', () => {
      if (this.selected !== entry) {
        background.setStrokeStyle(1, 0x6fd08c, 0.6);
        title.setColor('#a6f4c5');
      }
    });
    background.on('pointerout', () => {
      if (this.selected !== entry) {
        background.setStrokeStyle(1, 0x2a3f33, 1);
        title.setColor('#d8e2dc');
      }
    });
    background.on('pointerdown', () => this.selectEntry(entry));

    (container as any).setData('entry', entry);
    (container as any).setData('background', background);
    (container as any).setData('title', title);

    this.list.addRow(container, 46);
  }

  private selectEntry(entry: ScenarioEntry): void {
    if (this.selected) {
      const prev = this.findListItem(this.selected);
      if (prev) {
        const bg = (prev as any).getData('background');
        const title = (prev as any).getData('title');
        bg?.setStrokeStyle(1, 0x2a3f33, 1);
        title?.setColor('#d8e2dc');
      }
    }

    this.selected = entry;

    const current = this.findListItem(entry);
    if (current) {
      const bg = (current as any).getData('background');
      const title = (current as any).getData('title');
      bg?.setStrokeStyle(2, 0x6fd08c, 1);
      title?.setColor('#ffffff');
    }

    this.detail.select(entry);
  }

  private findListItem(entry: ScenarioEntry): Phaser.GameObjects.Container | undefined {
    for (const item of this.listItems) {
      if ((item as any).getData('entry') === entry) {
        return item as Phaser.GameObjects.Container;
      }
    }
    return undefined;
  }

  private editSelectedMap(): void {
    if (!this.selected) {
      return;
    }

    const { definition, sourceState } = this.selected;

    this.scene.start('map-editor', {
      definition: {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        map: sourceState.map,
      },
      state: sourceState,
      returnTo: 'scenario-menu',
    });
  }

  private startBattle(): void {
    if (!this.selected) {
      return;
    }

    this.scene.start('scenario', {
      definition: this.selected.definition,
      playerFaction: this.detail.playerFaction,
    });
  }
}
