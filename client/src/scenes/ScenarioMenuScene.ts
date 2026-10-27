import Phaser from 'phaser';
import { mapTileCount } from '../core/map';
import { ensureScenarioArmies, type ScenarioDefinition } from '../core/scenario';
import { countUnits, type GameState } from '../core/state';
import {
  listSavedMaps,
  loadSavedMap,
  type SavedMapSummary,
} from '../storage/maps';
import { formatTimestamp } from '../view/format';
import { drawMapPreview, previewLayout } from '../view/mapPreview';
import { ScrollList } from '../view/scrollList';
import { FACTION_DEFS, type FactionId } from '../core/units';

const TITLE_Y = 30;
const LIST_X = 40;
const LIST_Y = 70;
const LIST_BOTTOM_MARGIN = 70;
const LIST_WIDTH = 380;
const DETAIL_X = 450;
const DETAIL_Y = 70;
const DETAIL_WIDTH = 790;
const PREVIEW_SIZE = 4;
const PREVIEW_PADDING = 10;

interface ScenarioEntry {
  readonly definition: ScenarioDefinition;
  readonly sourceState: GameState;
  readonly meta: string;
}

export class ScenarioMenuScene extends Phaser.Scene {
  private list!: ScrollList;
  private entries: ScenarioEntry[] = [];
  private listItems: Phaser.GameObjects.GameObject[] = [];

  private detailPanel!: Phaser.GameObjects.Rectangle;
  private detailTitle!: Phaser.GameObjects.Text;
  private detailDesc!: Phaser.GameObjects.Text;
  private detailStats!: Phaser.GameObjects.Text;
  private previewSprites: Phaser.GameObjects.Image[] = [];
  private factionBlue!: Phaser.GameObjects.Text;
  private factionRed!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Rectangle;

  private selected: ScenarioEntry | null = null;
  private playerFaction: FactionId = 'blue';
  private loadToken = 0;

  constructor() {
    super('scenario-menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.entries = [];
    this.listItems = [];
    this.previewSprites = [];
    this.selected = null;
    this.playerFaction = 'blue';
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

    this.createDetailPanel();
    this.createFactionControls();
    this.createEditButton();
    this.createStartButton();

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
      this.updateDetail(this.selected);
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
    this.playerFaction = 'blue';

    const current = this.findListItem(entry);
    if (current) {
      const bg = (current as any).getData('background');
      const title = (current as any).getData('title');
      bg?.setStrokeStyle(2, 0x6fd08c, 1);
      title?.setColor('#ffffff');
    }

    this.updateFactionButtons();
    this.updateDetail(entry);
  }

  private findListItem(entry: ScenarioEntry): Phaser.GameObjects.Container | undefined {
    for (const item of this.listItems) {
      if ((item as any).getData('entry') === entry) {
        return item as Phaser.GameObjects.Container;
      }
    }
    return undefined;
  }

  private createDetailPanel(): void {
    this.detailPanel = this.add.rectangle(DETAIL_X, DETAIL_Y, DETAIL_WIDTH, 580, 0x0b0f14, 0.92);
    this.detailPanel.setOrigin(0, 0);
    this.detailPanel.setStrokeStyle(1, 0x3d6b4f, 1);

    this.detailTitle = this.add
      .text(DETAIL_X + 24, DETAIL_Y + 24, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f2f5f7',
      });

    this.detailDesc = this.add
      .text(DETAIL_X + 24, DETAIL_Y + 62, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
        wordWrap: { width: DETAIL_WIDTH - 48 },
        lineSpacing: 2,
      });

    this.detailStats = this.add
      .text(DETAIL_X + 24, DETAIL_Y + 150, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      });

    this.add
      .text(DETAIL_X + 24, DETAIL_Y + 190, 'Wybierz frakcję, z którą chcesz grać:', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
      });
  }

  private createFactionControls(): void {
    this.add
      .text(DETAIL_X + 24, DETAIL_Y + 220, 'GRAJ JAKO:', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      });

    this.factionBlue = this.add
      .text(DETAIL_X + 24, DETAIL_Y + 246, '> NIEBIESCY <', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setInteractive({ useHandCursor: true });

    this.factionRed = this.add
      .text(DETAIL_X + 150, DETAIL_Y + 246, '> CZERWONI <', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
      })
      .setInteractive({ useHandCursor: true });

    this.factionBlue.on('pointerover', () => {
      if (this.playerFaction !== 'blue') this.factionBlue.setColor('#a6f4c5');
    });
    this.factionBlue.on('pointerout', () => this.updateFactionButtons());
    this.factionBlue.on('pointerdown', () => {
      this.playerFaction = 'blue';
      this.updateFactionButtons();
    });

    this.factionRed.on('pointerover', () => {
      if (this.playerFaction !== 'red') this.factionRed.setColor('#a6f4c5');
    });
    this.factionRed.on('pointerout', () => this.updateFactionButtons());
    this.factionRed.on('pointerdown', () => {
      this.playerFaction = 'red';
      this.updateFactionButtons();
    });
  }

  private updateFactionButtons(): void {
    this.factionBlue.setColor(this.playerFaction === 'blue' ? '#ffffff' : '#9fb0a5');
    this.factionRed.setColor(this.playerFaction === 'red' ? '#ffffff' : '#9fb0a5');
  }

  private createEditButton(): void {
    const { height } = this.scale;
    const button = this.add.rectangle(
      DETAIL_X + 24,
      height - 166,
      DETAIL_WIDTH - 48,
      36,
      0x141c22,
      1,
    );
    button.setOrigin(0, 0);
    button.setStrokeStyle(1, 0x3d6b4f, 1);
    button.setInteractive({ useHandCursor: true });

    const label = this.add
      .text(DETAIL_X + DETAIL_WIDTH / 2, height - 148, 'EDYTUJ MAPĘ', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    button.on('pointerover', () => {
      button.setFillStyle(0x1c2830, 1);
      label.setColor('#a6f4c5');
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x141c22, 1);
      label.setColor('#d8e2dc');
    });
    button.on('pointerdown', () => this.editSelectedMap());
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

  private createStartButton(): void {
    const { height } = this.scale;
    this.startButton = this.add.rectangle(
      DETAIL_X + 24,
      height - 110,
      DETAIL_WIDTH - 48,
      44,
      0x1f6b45,
      1,
    );
    this.startButton.setOrigin(0, 0);
    this.startButton.setStrokeStyle(1, 0x6fd08c, 0.8);
    this.startButton.setInteractive({ useHandCursor: true });

    this.add
      .text(DETAIL_X + DETAIL_WIDTH / 2, height - 88, 'ROZPOCZNIJ BITWĘ', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.startButton.on('pointerover', () => this.startButton.setFillStyle(0x2b8a5b, 1));
    this.startButton.on('pointerout', () => this.startButton.setFillStyle(0x1f6b45, 1));
    this.startButton.on('pointerdown', () => this.startBattle());
  }

  private updateDetail(entry: ScenarioEntry): void {
    const map = entry.definition.state.map;
    const counts = countUnits(entry.definition.state.units);
    const tiles = mapTileCount(map);

    this.detailTitle.setText(entry.definition.name);
    this.detailDesc.setText(entry.definition.description);
    this.detailStats.setText(
      `Rozmiar mapy: ${tiles} kafli\nJednostki: ${counts.blue} niebieskich · ${counts.red} czerwonych\nGracz: ${FACTION_DEFS[this.playerFaction].label}`,
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

    this.previewSprites = drawMapPreview(this, map, previewSize, layout.origin);
    for (const sprite of this.previewSprites) {
      sprite.setPosition(sprite.x + left, sprite.y + top);
      sprite.setDepth(2);
      this.add.existing(sprite);
    }
  }

  private startBattle(): void {
    if (!this.selected) {
      return;
    }

    this.scene.start('scenario', {
      definition: this.selected.definition,
      playerFaction: this.playerFaction,
    });
  }
}
