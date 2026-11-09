import Phaser from 'phaser';
import { attackUnit, canAttack, canAttackThisTurn } from '../core/combat';
import type { HexCoord } from '../core/map';
import {
  findUnitAt,
  getMovePath,
  mapTileCount,
  moveTargets,
  moveUnit,
} from '../core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  type ScenarioDefinition,
} from '../core/scenario';
import type { GameState } from '../core/state';
import { attackTiles } from '../core/ranges';
import {
  beginTurn,
  createTurnState,
  nextTurn,
  type TurnState,
} from '../core/turn';
import { FULL_MAP_RANGE, UNIT_DEFS, type FactionId, type Unit } from '../core/units';
import { visibleTileKeys, visibleUnitAt, visibleUnits } from '../core/vision';
import { HexMapView, HEX_SIZE, outlineHex } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { RecruitDialog } from '../view/recruitDialog';
import { BAR_HEIGHT, ScenarioCommandBar } from '../view/scenarioCommandBar';
import { playHitSound, playMoveSound, playShotSound, preloadCombatAudio } from '../view/combatAudio';
import { preloadFogTile } from '../view/fogTile';
import { playShotEffect } from '../view/shotEffect';
import { preloadTerrainTiles } from '../view/terrainTiles';
import { UnitLayer } from '../view/unitLayer';
import { VisionFog } from '../view/visionFog';

const EDGE_PAN_MARGIN = 24;
const MOVE_HINT_COLOR = 0x6fd08c;
const ATTACK_HINT_COLOR = 0xe0563f;
const ATTACK_HINT_SIZE = HEX_SIZE - 8;

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
  private firing = false;
  private readonly exploredByFaction = new Map<FactionId, Set<string>>();

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitLayer!: UnitLayer;
  private visionFog!: VisionFog;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private commandBar!: ScenarioCommandBar;
  private recruitDialog!: RecruitDialog;
  private cursor!: Phaser.GameObjects.Graphics;
  private selection!: Phaser.GameObjects.Graphics;
  private rangeHints!: Phaser.GameObjects.Graphics;
  private pathHints!: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('scenario');
  }

  preload(): void {
    preloadTerrainTiles(this);
    preloadFogTile(this);
    preloadCombatAudio();
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.playerFaction = data?.playerFaction ?? 'blue';
    this.turn = createTurnState(this.playerFaction);
    this.state = beginTurn(ensureScenarioArmies(this.scenario.state), this.turn.faction);
    this.hover = null;
    this.selected = null;
    this.movePath = null;
    this.firing = false;
    this.exploredByFaction.clear();
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
    this.unitLayer = new UnitLayer(this, visibleUnits(this.state, this.turn.faction));
    this.visionFog = new VisionFog(this, this.state.map);

    this.selection = this.add.graphics();
    this.selection.setDepth(4);
    this.rangeHints = this.add.graphics();
    this.rangeHints.setDepth(3);
    this.pathHints = this.add.graphics();
    this.pathHints.setDepth(6);
    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.commandBar = new ScenarioCommandBar(this, {
      onEndTurn: () => this.endTurn(),
      onRecruit: () => {
        if (!this.firing) {
          this.recruitDialog.show(this.turn.faction);
        }
      },
      onScenarioMenu: () => this.scene.start('scenario-menu'),
      onMainMenu: () => this.scene.start('menu'),
    });
    this.recruitDialog = new RecruitDialog(this);

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
    this.refreshFog();

    (globalThis as { __mvawScene?: ScenarioScene }).__mvawScene = this;
  }

  update(_time: number, delta: number): void {
    this.unitLayer.update(delta);

    if (this.recruitDialog?.isOpen) {
      return;
    }

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

    this.cameras.main.ignore([
      ...this.commandBar.uiObjects,
      ...this.recruitDialog.uiObjects,
    ]);
    uiCamera.ignore([
      this.cursor,
      this.selection,
      this.rangeHints,
      this.pathHints,
      ...this.mapView.objects(),
      ...this.unitLayer.objects(),
      ...this.visionFog.objects,
    ]);

    this.uiCamera = uiCamera;
  }

  private refreshUnits(): void {
    this.unitLayer.setUnits(visibleUnits(this.state, this.turn.faction));
    this.uiCamera?.ignore(this.unitLayer.objects());
    this.refreshFog();
  }

  private refreshFog(): void {
    if (!this.state.map.fogOfWar) {
      this.visionFog.hide();
      return;
    }

    const visible = visibleTileKeys(this.state, this.turn.faction);
    const explored =
      this.exploredByFaction.get(this.turn.faction) ?? new Set<string>();

    for (const key of visible) {
      explored.add(key);
    }

    this.exploredByFaction.set(this.turn.faction, explored);

    if (visible.size >= mapTileCount(this.state.map)) {
      this.visionFog.hide();
      return;
    }

    this.visionFog.show(visible, explored);
  }

  private refreshUnitPreview(): void {
    this.commandBar.refreshUnit({
      selected: this.selected,
      state: this.state,
      movePath: this.movePath,
    });
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.firing) {
      return;
    }

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

    if (this.tryAttackAt(coord)) {
      return;
    }

    if (this.tryMoveAlongPath(coord)) {
      return;
    }

    if (this.trySetPath(coord)) {
      return;
    }

    this.selectAt(coord);
  }

  private tryAttackAt(coord: HexCoord): boolean {
    if (this.firing || !this.selected || this.selected.faction !== this.turn.faction) {
      return false;
    }

    const attacker = findUnitAt(this.state, this.selected.pos) ?? this.selected;
    const target = visibleUnitAt(this.state, coord, this.turn.faction);

    if (!target || !canAttack(attacker, target)) {
      return false;
    }

    const next = attackUnit(this.state, attacker.id, target.id);

    if (next === this.state) {
      return false;
    }

    this.firing = true;
    playShotSound(UNIT_DEFS[attacker.kind].weapon);
    playShotEffect(
      this,
      this.unitLayer.center(attacker.pos),
      this.unitLayer.center(target.pos),
      () => this.applyAttack(attacker.id, next),
      (object) => this.uiCamera?.ignore(object),
    );

    return true;
  }

  private applyAttack(attackerId: string, next: GameState): void {
    this.state = next;
    this.selected = this.state.units.find((unit) => unit.id === attackerId) ?? null;
    this.movePath = null;
    this.firing = false;
    playHitSound();
    this.refreshUnits();
    this.drawSelection();
    this.drawRangeHints();
    this.drawPath();
    this.refreshHud();
    this.refreshUnitPreview();
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

    playMoveSound(UNIT_DEFS[unit.kind].moveSound);
    this.state = next;
    this.selected = findUnitAt(this.state, coord) ?? null;
    this.movePath = null;
    this.refreshUnits();
    this.drawSelection();
    this.drawRangeHints();
    this.drawPath();
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
    if (this.recruitDialog.isOpen) {
      if (event.key === 'Escape') {
        this.recruitDialog.hide();
      }

      return;
    }

    if (this.firing) {
      return;
    }

    if (event.key === 'Escape') {
      this.scene.start(event.shiftKey ? 'menu' : 'scenario-menu');
      return;
    }

    if (event.key === 't' || event.key === 'T') {
      this.endTurn();
    }
  }

  private endTurn(): void {
    if (this.firing) {
      return;
    }

    this.turn = nextTurn(this.turn);
    this.state = beginTurn(this.state, this.turn.faction);
    this.selected = null;
    this.movePath = null;
    this.selection.clear();
    this.rangeHints.clear();
    this.pathHints.clear();
    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private selectAt(coord: HexCoord): void {
    this.selected = visibleUnitAt(this.state, coord, this.turn.faction) ?? null;
    this.movePath = null;
    this.drawSelection();
    this.drawRangeHints();
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

  private drawRangeHints(): void {
    this.rangeHints.clear();

    if (!this.selected) {
      return;
    }

    const unit = findUnitAt(this.state, this.selected.pos) ?? this.selected;
    const canStrike = unit.faction === this.turn.faction && canAttackThisTurn(unit);
    const canMove =
      unit.faction === this.turn.faction && !unit.hasActed && unit.movesLeft > 0;

    if (canMove) {
      for (const target of moveTargets(this.state, unit)) {
        outlineHex(this.rangeHints, this.mapView.center(target), MOVE_HINT_COLOR, 2);
      }
    }

    if (canStrike && UNIT_DEFS[unit.kind].attackRange < FULL_MAP_RANGE) {
      for (const target of attackTiles(this.state.map, unit)) {
        outlineHex(
          this.rangeHints,
          this.mapView.center(target),
          ATTACK_HINT_COLOR,
          2,
          ATTACK_HINT_SIZE,
        );
      }
    } else if (canStrike) {
      for (const target of visibleUnits(this.state, this.turn.faction)) {
        if (target.faction === unit.faction) {
          continue;
        }

        outlineHex(
          this.rangeHints,
          this.mapView.center(target.pos),
          ATTACK_HINT_COLOR,
          2,
          ATTACK_HINT_SIZE,
        );
      }
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
    return this.recruitDialog?.isOpen || pointer.y >= this.scale.height - BAR_HEIGHT;
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
