import Phaser from 'phaser';
import type { HexCoord } from '../core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  type ScenarioDefinition,
} from '../core/scenario';
import {
  findUnitAt,
  getMovePath,
  moveTargets,
  moveUnit,
  type GameState,
} from '../core/state';
import {
  beginTurn,
  createTurnState,
  nextTurn,
  type TurnState,
} from '../core/turn';
import type { FactionId, Unit } from '../core/units';
import { HexMapView, outlineHex } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { BAR_HEIGHT, ScenarioCommandBar } from '../view/scenarioCommandBar';
import { preloadTerrainTiles } from '../view/terrainTiles';
import { UnitLayer } from '../view/unitLayer';

const EDGE_PAN_MARGIN = 24;

interface ScenarioData {
  readonly definition?: ScenarioDefinition;
  readonly playerFaction?: FactionId;
}

export class ScenarioScene extends Phaser.Scene {
  private scenario: ScenarioDefinition = BUILT_IN_SCENARIOS[0]!;
  private state: GameState = this.scenario.state;
  private turn: TurnState = createTurnState();
  private playerFaction: FactionId = 'blue';
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();

  private hover: HexCoord | null = null;
  private selected: Unit | null = null;
  private movePath: HexCoord[] | null = null;

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitLayer!: UnitLayer;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private commandBar!: ScenarioCommandBar;
  private cursor!: Phaser.GameObjects.Graphics;
  private selection!: Phaser.GameObjects.Graphics;
  private moveHints!: Phaser.GameObjects.Graphics;
  private pathHints!: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('scenario');
  }

  preload(): void {
    preloadTerrainTiles(this);
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.playerFaction = data?.playerFaction ?? 'blue';
    this.turn = createTurnState(this.playerFaction);
    this.state = beginTurn(ensureScenarioArmies(this.scenario.state), this.turn.faction);
    this.hover = null;
    this.selected = null;
    this.movePath = null;
  }

  create(): void {
    this.uiCamera = undefined;
    this.movePath = null;

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
    this.pathHints = this.add.graphics();
    this.pathHints.setDepth(6);
    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.commandBar = new ScenarioCommandBar(this, {
      onEndTurn: () => this.endTurn(),
      onScenarioMenu: () => this.scene.start('scenario-menu'),
      onMainMenu: () => this.scene.start('menu'),
    });

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

    const start =
      this.state.units.find((unit) => unit.faction === this.playerFaction)?.pos ??
      this.state.units.find((unit) => unit.faction === 'blue')?.pos ??
      { col: 5, row: 13 };

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

  private setupUiCamera(): void {
    const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    uiCamera.setName('scenario-ui');
    uiCamera.setScroll(0, 0);

    this.cameras.main.ignore([...this.commandBar.uiObjects]);
    uiCamera.ignore([
      this.cursor,
      this.selection,
      this.moveHints,
      this.pathHints,
      ...this.mapView.objects(),
      ...this.unitLayer.objects(),
    ]);

    this.uiCamera = uiCamera;
  }

  private refreshUnits(): void {
    this.unitLayer.setUnits(this.state.units);
    this.uiCamera?.ignore(this.unitLayer.objects());
  }

  private refreshUnitPreview(): void {
    this.commandBar.refreshUnit({
      selected: this.selected,
      state: this.state,
      movePath: this.movePath,
    });
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

    if (this.tryMoveAlongPath(coord)) {
      return;
    }

    if (this.trySetPath(coord)) {
      return;
    }

    this.selectAt(coord);
  }

  private trySetPath(coord: HexCoord): boolean {
    if (!this.selected || this.selected.faction !== this.turn.faction) {
      return false;
    }

    const unit = findUnitAt(this.state, this.selected.pos) ?? this.selected;

    if (unit.hasActed || unit.movesLeft <= 0) {
      return false;
    }

    if (findUnitAt(this.state, coord) && !(coord.col === unit.pos.col && coord.row === unit.pos.row)) {
      return false;
    }

    const path = getMovePath(this.state, unit, coord);

    if (!path || path.length === 0) {
      this.movePath = null;
      this.drawPath();
      return false;
    }

    this.movePath = path;
    this.drawPath();
    return true;
  }

  private tryMoveAlongPath(coord: HexCoord): boolean {
    if (!this.selected || this.selected.faction !== this.turn.faction) {
      return false;
    }

    if (!this.movePath || this.movePath.length === 0) {
      return false;
    }

    const target = this.movePath[this.movePath.length - 1];

    if (!target || target.col !== coord.col || target.row !== coord.row) {
      return false;
    }

    const unit = findUnitAt(this.state, this.selected.pos) ?? this.selected;
    const next = moveUnit(this.state, unit.id, coord);

    if (next === this.state) {
      return false;
    }

    this.animateUnitAlongPath(unit.id, this.movePath, coord);
    this.state = next;
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.movePath = null;
    this.unitLayer.setUnits(this.state.units, false);
    this.drawSelection();
    this.drawMoveHints();
    this.drawPath();
    this.refreshHud();
    this.refreshUnitPreview();

    return true;
  }

  private animateUnitAlongPath(unitId: string, path: HexCoord[], final: HexCoord): void {
    const token = this.unitLayer.getToken(unitId);

    if (!token) {
      return;
    }

    this.tweens.killTweensOf(token);
    const steps = [path[0] ? path[0] : final];

    for (let i = 1; i < path.length; i += 1) {
      steps.push(path[i]!);
    }

    if (steps[steps.length - 1]?.col !== final.col || steps[steps.length - 1]?.row !== final.row) {
      steps.push(final);
    }

    let delay = 0;

    for (const step of steps) {
      const center = this.mapView.center(step);
      this.tweens.add({
        targets: token,
        x: center.x,
        y: center.y,
        duration: 100,
        ease: 'Linear',
        delay,
      });
      delay += 100;
    }
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
    this.movePath = null;
    this.selection.clear();
    this.moveHints.clear();
    this.pathHints.clear();
    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private selectAt(coord: HexCoord): void {
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.movePath = null;
    this.drawSelection();
    this.drawMoveHints();
    this.drawPath();
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

    const unit = findUnitAt(this.state, this.selected.pos) ?? this.selected;

    if (unit.hasActed || unit.movesLeft <= 0) {
      return;
    }

    for (const target of moveTargets(this.state, unit)) {
      outlineHex(this.moveHints, this.mapView.center(target), 0x6fd08c, 2);
    }
  }

  private drawPath(): void {
    this.pathHints.clear();

    if (!this.movePath || this.movePath.length === 0) {
      return;
    }

    for (const coord of this.movePath) {
      outlineHex(this.pathHints, this.mapView.center(coord), 0xf2d35c, 2);
    }

    const target = this.movePath[this.movePath.length - 1];

    if (target) {
      outlineHex(this.pathHints, this.mapView.center(target), 0xf5b700, 3);
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
    this.commandBar.refreshScenario({
      scenario: this.scenario,
      state: this.state,
      turn: this.turn,
      hover: this.hover,
    });
  }
}
