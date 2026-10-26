import Phaser from 'phaser';
import { mapTileCount, terrainAt, toDoubled, type HexCoord } from '../core/map';
import { BUILT_IN_SCENARIOS, ensureScenarioArmies, type ScenarioDefinition } from '../core/scenario';
import { countUnits, findUnitAt, moveTargets, moveUnit, type GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/terrain';
import { beginTurn, createTurnState, isActiveFaction, nextTurn, type TurnState } from '../core/turn';
import { FACTION_DEFS, UNIT_DEFS, type Unit } from '../core/units';
import { HexMapView, outlineHex } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { UnitLayer, unitTexture } from '../view/unitLayer';

const BAR_HEIGHT = 116;
const EDGE_PAN_MARGIN = 24;

interface ScenarioData {
  readonly definition?: ScenarioDefinition;
}

export class ScenarioScene extends Phaser.Scene {
  private scenario: ScenarioDefinition = BUILT_IN_SCENARIOS[0]!;
  private state: GameState = this.scenario.state;
  private turn: TurnState = createTurnState();
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();

  private hover: HexCoord | null = null;
  private selected: Unit | null = null;

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitLayer!: UnitLayer;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private readonly uiObjects: Phaser.GameObjects.GameObject[] = [];
  private bar!: Phaser.GameObjects.Rectangle;
  private barTurnLabel!: Phaser.GameObjects.Text;
  private scenarioName!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Image;
  private previewHint!: Phaser.GameObjects.Text;
  private unitName!: Phaser.GameObjects.Text;
  private unitStats!: Phaser.GameObjects.Text;
  private unitMeta!: Phaser.GameObjects.Text;
  private unitStatus!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Text;
  private factionText!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Graphics;
  private selection!: Phaser.GameObjects.Graphics;
  private moveHints!: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('scenario');
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.turn = createTurnState();
    this.state = beginTurn(ensureScenarioArmies(this.scenario.state), this.turn.faction);
    this.hover = null;
    this.selected = null;
  }

  create(): void {
    this.uiObjects.length = 0;
    this.uiCamera = undefined;

    this.viewport = new MapViewport(this, this.state.map, {
      zoomMin: 0.6,
      zoomMax: 2.5,
      startZoom: 0.9,
      edgePanMargin: EDGE_PAN_MARGIN,
      edgePanBlocked: (pointer) => this.pointerOverUi(pointer) && !this.pointerOverBarEdge(pointer),
    });

    this.mapView = new HexMapView(this, this.state.map);
    this.unitLayer = new UnitLayer(this, this.state.units);

    this.selection = this.add.graphics();
    this.selection.setDepth(4);
    this.moveHints = this.add.graphics();
    this.moveHints.setDepth(3);
    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.factionText = this.registerUi(
      this.add
        .text(this.scale.width - 20, 20, this.factionLine(), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d8e2dc',
          align: 'right',
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(10),
    );

    this.createCommandBar();

    this.setupUiCamera();

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
    this.refreshUnitPreview();
  }

  update(_time: number, delta: number): void {
    this.viewport.update(delta, {
      left: (this.cursors?.left.isDown ?? false) || this.isDown('A'),
      right: (this.cursors?.right.isDown ?? false) || this.isDown('D'),
      up: (this.cursors?.up.isDown ?? false) || this.isDown('W'),
      down: (this.cursors?.down.isDown ?? false) || this.isDown('S'),
    });
  }

  private registerUi<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.uiObjects.push(object);

    return object;
  }

  private setupUiCamera(): void {
    const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    uiCamera.setName('scenario-ui');
    uiCamera.setScroll(0, 0);

    this.cameras.main.ignore(this.uiObjects);
    uiCamera.ignore([
      this.cursor,
      this.selection,
      this.moveHints,
      ...this.mapView.objects(),
      ...this.unitLayer.objects(),
    ]);

    this.uiCamera = uiCamera;
  }

  private refreshUnits(): void {
    this.unitLayer.setUnits(this.state.units);
    this.uiCamera?.ignore(this.unitLayer.objects());
  }

  private makeBarLink(
    label: string,
    x: number,
    y: number,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const link = this.registerUi(
      this.add
        .text(x, y, label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22)
        .setInteractive({ useHandCursor: true }),
    );

    link.on('pointerover', () => link.setColor('#a6f4c5'));
    link.on('pointerout', () => link.setColor('#9fb0a5'));
    link.on('pointerdown', action);

    return link;
  }

  private createCommandBar(): void {
    const barY = this.scale.height - BAR_HEIGHT;
    const previewX = 52;
    const unitTextX = 96;
    const scenarioX = 420;
    const navX = 792;
    const turnX = 1010;
    const turnWidth = this.scale.width - turnX - 16;

    this.bar = this.registerUi(
      this.add
        .rectangle(0, barY, this.scale.width, BAR_HEIGHT, 0x0b0f14, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20),
    );
    this.bar.setStrokeStyle(1, 0x3d6b4f, 1);

    this.registerUi(
      this.add
        .rectangle(0, barY, this.scale.width, 2, 0x3d6b4f, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.preview = this.registerUi(
      this.add
        .image(previewX, barY + BAR_HEIGHT / 2, unitTexture(this, 'infantry', 'blue').key)
        .setScale(2.2)
        .setScrollFactor(0)
        .setDepth(22)
        .setVisible(false),
    );

    this.previewHint = this.registerUi(
      this.add
        .text(previewX, barY + BAR_HEIGHT / 2, 'BRAK\nWYBORU', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6c7d72',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitName = this.registerUi(
      this.add
        .text(unitTextX, barY + 12, '', {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitStats = this.registerUi(
      this.add
        .text(unitTextX, barY + 38, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d8e2dc',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitMeta = this.registerUi(
      this.add
        .text(unitTextX, barY + 60, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitStatus = this.registerUi(
      this.add
        .text(unitTextX, barY + 82, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6fd08c',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.registerUi(
      this.add
        .rectangle(404, barY + 16, 1, BAR_HEIGHT - 32, 0x2a3a31, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.scenarioName = this.registerUi(
      this.add
        .text(scenarioX, barY + 10, '', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.hud = this.registerUi(
      this.add
        .text(scenarioX, barY + 32, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#d8e2dc',
          wordWrap: { width: 340 },
          lineSpacing: 2,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.makeBarLink('MENU SCENARIUSZY', navX, barY + 20, () =>
      this.scene.start('scenario-menu'),
    );
    this.makeBarLink('MENU GŁÓWNE', navX, barY + 42, () => this.scene.start('menu'));

    this.registerUi(
      this.add
        .rectangle(980, barY + 16, 1, BAR_HEIGHT - 32, 0x2a3a31, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.makeBarButton('ZAKOŃCZ TURĘ', turnX, barY + 14, turnWidth, 42, () =>
      this.endTurn(),
    );

    this.barTurnLabel = this.registerUi(
      this.add
        .text(turnX, barY + 62, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.registerUi(
      this.add
        .text(turnX, barY + 84, 'LPM — wybór/ruch · T — tura\nkółko — zoom · ESC — scenariusze', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
          lineSpacing: 1,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );
  }

  private makeBarButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const background = this.registerUi(
      this.add
        .rectangle(x, y, width, height, 0x1f6b45, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, 0x6fd08c, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    const text = this.registerUi(
      this.add
        .text(x + width / 2, y + height / 2, label, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    background.on('pointerover', () => background.setFillStyle(0x2b8a5b, 1));
    background.on('pointerout', () => background.setFillStyle(0x1f6b45, 1));
    background.on('pointerdown', action);

    return text;
  }

  private refreshUnitPreview(): void {
    const unit = this.selected;

    if (!unit) {
      this.preview.setVisible(false);
      this.previewHint.setVisible(true);
      this.unitName.setText('Brak wybranej jednostki').setColor('#6c7d72');
      this.unitStats.setText('Kliknij jednostkę na mapie');
      this.unitMeta.setText('');
      this.unitStatus.setText('');
      return;
    }

    const stats = UNIT_DEFS[unit.kind];
    const terrain = terrainAt(this.state.map, unit.pos);
    const doubled = toDoubled(unit.pos);

    this.preview.setTexture(unitTexture(this, unit.kind, unit.faction).key).setVisible(true);
    this.previewHint.setVisible(false);
    this.unitName
      .setText(`${stats.label} — ${FACTION_DEFS[unit.faction].label}`)
      .setColor('#f2f5f7');
    this.unitStats.setText(
      `HP ${unit.hp}/${stats.maxHp} · ATK ${stats.attack} · DEF ${stats.defense}`,
    );
    this.unitMeta.setText(
      `Teren: ${terrain ? TERRAIN_DEFS[terrain].label : 'pusto'} · Heks: ${doubled.col},${doubled.row}`,
    );
    this.unitStatus
      .setText(unit.hasActed ? 'Działała — ruch w następnej turze' : 'Gotowa — ruch o jedno pole')
      .setColor(unit.hasActed ? '#e0a15a' : '#6fd08c');
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.pointerOverUi(pointer)) {
      return;
    }

    if (this.viewport.startPan(pointer)) {
      return;
    }

    if (pointer.button !== 0) {
      return;
    }

    const coord = this.viewport.hexAt(pointer);

    if (this.tryMoveSelected(coord)) {
      return;
    }

    this.selectAt(coord);
  }

  private tryMoveSelected(coord: HexCoord): boolean {
    if (!this.selected || this.selected.faction !== this.turn.faction) {
      return false;
    }

    const next = moveUnit(this.state, this.selected.id, coord);

    if (next === this.state) {
      return false;
    }

    this.state = next;
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.refreshUnits();
    this.drawSelection();
    this.drawMoveHints();
    this.refreshHud();
    this.refreshUnitPreview();

    return true;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.movePan(pointer)) {
      return;
    }

    if (this.pointerOverUi(pointer)) {
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
    if (this.pointerOverUi(pointer)) {
      return;
    }

    this.viewport.zoom(deltaY);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.scene.start(event.shiftKey ? 'menu' : 'scenario-menu');
      return;
    }

    if (event.key === 't' || event.key === 'T') {
      this.endTurn();
    }
  }

  private endTurn(): void {
    this.turn = nextTurn(this.turn);
    this.state = beginTurn(this.state, this.turn.faction);
    this.selected = null;
    this.selection.clear();
    this.moveHints.clear();
    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private selectAt(coord: HexCoord): void {
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.drawSelection();
    this.drawMoveHints();
    this.refreshHud();
    this.refreshUnitPreview();
  }

  private drawSelection(): void {
    this.selection.clear();

    if (this.selected) {
      outlineHex(this.selection, this.mapView.center(this.selected.pos), 0xf2d35c, 3);
    }
  }

  private drawMoveHints(): void {
    this.moveHints.clear();

    if (!this.selected || this.selected.faction !== this.turn.faction) {
      return;
    }

    for (const target of moveTargets(this.state, this.selected)) {
      outlineHex(this.moveHints, this.mapView.center(target), 0x6fd08c, 2);
    }
  }

  private drawCursor(): void {
    this.cursor.clear();

    if (!this.hover) {
      return;
    }

    outlineHex(this.cursor, this.mapView.center(this.hover), 0xffffff, 2);
  }

  private pointerOverBarEdge(pointer: Phaser.Input.Pointer): boolean {
    return pointer.y >= this.scale.height - EDGE_PAN_MARGIN;
  }

  private pointerOverUi(pointer: Phaser.Input.Pointer): boolean {
    return pointer.y >= this.scale.height - BAR_HEIGHT;
  }

  private refreshHud(): void {
    const counts = countUnits(this.state.units);
    const description = this.scenario.description.trim();
    const lines: string[] = [];

    if (description) {
      lines.push(
        description.length > 110 ? `${description.slice(0, 109)}…` : description,
      );
    }

    lines.push(
      `Jednostki: ${counts.blue} nieb. · ${counts.red} czerw. · Kafle: ${mapTileCount(this.state.map)}`,
    );

    if (this.hover) {
      const terrain = terrainAt(this.state.map, this.hover);
      const doubled = toDoubled(this.hover);
      const unit = findUnitAt(this.state, this.hover);
      const terrainLabel = terrain ? TERRAIN_DEFS[terrain].label : 'pusto';
      const unitLabel = unit
        ? ` · ${FACTION_DEFS[unit.faction].label} ${UNIT_DEFS[unit.kind].label}`
        : '';

      lines.push(`Heks: ${doubled.col},${doubled.row} — ${terrainLabel}${unitLabel}`);
    } else {
      lines.push('Heks: —');
    }

    this.scenarioName.setText(
      this.scenario.name.length > 40
        ? `${this.scenario.name.slice(0, 39)}…`
        : this.scenario.name,
    );
    this.hud.setText(lines.join('\n'));
    this.factionText.setText(this.factionLine());
    this.barTurnLabel.setText(
      `Tura ${this.turn.turn} — ${FACTION_DEFS[this.turn.faction].label}`,
    );
  }

  private factionLine(): string {
    const counts = countUnits(this.state.units);
    const blue = isActiveFaction(this.turn, 'blue') ? '▶ ' : '  ';
    const red = isActiveFaction(this.turn, 'red') ? '▶ ' : '  ';

    return `${blue}NIEBIESKA (${counts.blue})   ${red}CZERWONA (${counts.red})`;
  }
}
