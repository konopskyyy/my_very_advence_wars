import Phaser from 'phaser';
import { mapTileCount, terrainAt, toDoubled, type HexCoord } from '../core/map';
import { BUILT_IN_SCENARIOS, type ScenarioDefinition } from '../core/scenario';
import { countUnits, findUnitAt, type GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/terrain';
import { FACTION_DEFS, UNIT_DEFS, type Unit } from '../core/units';
import { HexMapView, outlineHex } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { UnitLayer } from '../view/unitLayer';

const PANEL_X = 0;
const PANEL_Y = 8;
const PANEL_WIDTH = 304;

interface ScenarioData {
  readonly definition?: ScenarioDefinition;
}

export class ScenarioScene extends Phaser.Scene {
  private scenario: ScenarioDefinition = BUILT_IN_SCENARIOS[0]!;
  private state: GameState = this.scenario.state;
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();

  private hover: HexCoord | null = null;
  private selected: Unit | null = null;

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private panel!: Phaser.GameObjects.Rectangle;
  private hud!: Phaser.GameObjects.Text;
  private scenarioButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Graphics;
  private selection!: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('scenario');
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.state = this.scenario.state;
    this.hover = null;
    this.selected = null;
  }

  create(): void {
    this.viewport = new MapViewport(this, this.state.map, {
      zoomMin: 0.6,
      zoomMax: 2.5,
      startZoom: 0.9,
    });

    this.mapView = new HexMapView(this, this.state.map);
    new UnitLayer(this, this.state.units);

    this.selection = this.add.graphics();
    this.selection.setDepth(4);
    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.panel = this.add.rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, 160, 0x0b0f14, 0.9);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(1, 0x3d6b4f, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(10);

    this.add
      .text(PANEL_X + 12, PANEL_Y + 10, 'SCENARIUSZ TESTOWY', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.hud = this.add
      .text(PANEL_X + 12, PANEL_Y + 32, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
        wordWrap: { width: PANEL_WIDTH - 24 },
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.scenarioButton = this.makePanelButton('MENU SCENARIUSZY', () =>
      this.scene.start('scenario-menu'),
    );
    this.menuButton = this.makePanelButton('MENU GŁÓWNE', () => this.scene.start('menu'));

    this.add
      .text(this.scale.width - 20, 20, this.factionLine(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);

    this.add
      .text(
        this.scale.width - 20,
        this.scale.height - 18,
        'LPM — wybór jednostki · kółko — zoom · ESC — scenariusze',
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        },
      )
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(10);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('wheel', this.onWheel, this);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      for (const code of ['W', 'A', 'S', 'D']) {
        this.keys.set(code, keyboard.addKey(code));
      }
      keyboard.on('keydown', this.onKeyDown, this);
    }

    const start = this.state.units.find((unit) => unit.faction === 'blue')?.pos ?? { col: 5, row: 13 };

    this.viewport.centerOn(start);
    this.refreshHud();
  }

  update(_time: number, delta: number): void {
    this.viewport.update(delta, {
      left: (this.cursors?.left.isDown ?? false) || this.isDown('A'),
      right: (this.cursors?.right.isDown ?? false) || this.isDown('D'),
      up: (this.cursors?.up.isDown ?? false) || this.isDown('W'),
      down: (this.cursors?.down.isDown ?? false) || this.isDown('S'),
    });
  }

  private makePanelButton(label: string, action: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(PANEL_X + 12, PANEL_Y + 40, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setColor('#a6f4c5'));
    button.on('pointerout', () => button.setColor('#ffffff'));
    button.on('pointerdown', action);

    return button;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.startPan(pointer)) {
      return;
    }

    if (pointer.button !== 0 || this.pointerOverPanel(pointer)) {
      return;
    }

    this.selectAt(this.viewport.hexAt(pointer));
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.movePan(pointer)) {
      return;
    }

    if (this.pointerOverPanel(pointer)) {
      if (this.hover) {
        this.hover = null;
        this.cursor.clear();
        this.refreshHud();
      }

      return;
    }

    const coord = this.viewport.hexAt(pointer);

    if (coord.col === this.hover?.col && coord.row === this.hover?.row) {
      return;
    }

    this.hover = coord;
    this.drawCursor();
    this.refreshHud();
  }

  private onPointerUp(): void {
    this.viewport.endPan();
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (this.pointerOverPanel(pointer)) {
      return;
    }

    this.viewport.zoom(deltaY);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.scene.start(event.shiftKey ? 'menu' : 'scenario-menu');
    }
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private selectAt(coord: HexCoord): void {
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.selection.clear();

    if (this.selected) {
      outlineHex(this.selection, this.mapView.center(this.selected.pos), 0xf2d35c, 3);
    }

    this.refreshHud();
  }

  private drawCursor(): void {
    this.cursor.clear();

    if (!this.hover) {
      return;
    }

    outlineHex(this.cursor, this.mapView.center(this.hover), 0xffffff, 2);
  }

  private pointerOverPanel(pointer: Phaser.Input.Pointer): boolean {
    return (
      pointer.x >= PANEL_X &&
      pointer.x <= PANEL_X + this.panel.width &&
      pointer.y >= PANEL_Y &&
      pointer.y <= PANEL_Y + this.panel.height
    );
  }

  private refreshHud(): void {
    const lines: string[] = [];

    lines.push(this.scenario.name);
    lines.push(this.scenario.description);
    lines.push('');

    const counts = countUnits(this.state.units);

    lines.push(`Jednostki: ${counts.blue} niebieskich · ${counts.red} czerwonych`);
    lines.push(`Kafle: ${mapTileCount(this.state.map)}`);

    if (this.hover) {
      const terrain = terrainAt(this.state.map, this.hover);
      const doubled = toDoubled(this.hover);
      const unit = findUnitAt(this.state, this.hover);
      const terrainLabel = terrain ? TERRAIN_DEFS[terrain].label : 'pusto';

      lines.push(`Heks: ${doubled.col},${doubled.row} — ${terrainLabel}`);

      if (unit) {
        lines.push(
          `Stoi: ${FACTION_DEFS[unit.faction].label} · ${UNIT_DEFS[unit.kind].label}`,
        );
      }
    } else {
      lines.push('Heks: —');
    }

    if (this.selected) {
      const stats = UNIT_DEFS[this.selected.kind];

      lines.push('');
      lines.push(`Wybrana: ${stats.label} (${FACTION_DEFS[this.selected.faction].label})`);
      lines.push(
        `HP ${this.selected.hp}/${stats.maxHp} · ruch ${stats.moveRange} · atak ${stats.attack} · obrona ${stats.defense}`,
      );
    }

    lines.push('');
    lines.push('Strzałki/WASD — kamera');
    lines.push('Środkowy — przeciąganie');
    lines.push('ESC — scenariusze · Shift+ESC — menu');

    this.hud.setText(lines.join('\n'));

    const buttonsY = this.hud.y + this.hud.height + 10;

    this.scenarioButton.setY(buttonsY);
    this.menuButton.setY(buttonsY + 18);

    this.panel.setSize(
      Math.max(PANEL_WIDTH, this.hud.width + 24),
      this.menuButton.y + this.menuButton.height + 12 - PANEL_Y,
    );
  }

  private factionLine(): string {
    const counts = countUnits(this.state.units);

    return `NIEBIESKA — gracz (${counts.blue})   CZERWONA — przeciwnik (${counts.red})`;
  }
}
