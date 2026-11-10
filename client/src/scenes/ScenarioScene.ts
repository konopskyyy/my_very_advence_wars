import Phaser from 'phaser';
import { canAttackThisTurn } from '../core/combat';
import type { HexCoord } from '../core/map';
import { mapTileCount, moveTargets } from '../core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  type ScenarioDefinition,
} from '../core/scenario';
import type { GameState } from '../core/state';
import { attackTiles } from '../core/ranges';
import {
  addAttack,
  buildTimeline,
  commitPlan,
  createTurnPlan,
  planState,
  removeLastAction,
  sampleTimeline,
  setMove,
  unitActions,
  type PlanError,
  type TimelineAttackClip,
  type TurnPlan,
  type TurnTimeline,
} from '../core/plan';
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
import { PlanTimeline } from '../view/planTimeline';
import { RecruitDialog } from '../view/recruitDialog';
import { BAR_HEIGHT, ScenarioCommandBar } from '../view/scenarioCommandBar';
import { installButtonClickSound } from '../view/buttonAudio';
import {
  playDeathSound,
  playHitSound,
  playShotSound,
} from '../view/combatAudio';
import { preloadFogTile } from '../view/fogTile';
import { playShotEffect } from '../view/shotEffect';
import { preloadTerrainTiles } from '../view/terrainTiles';
import { UnitLayer, unitTexture } from '../view/unitLayer';
import { VisionFog } from '../view/visionFog';
import { createReplayId, recordTurnPlan, startReplay } from '../storage/replays';

const EDGE_PAN_MARGIN = 24;
const MOVE_HINT_COLOR = 0x6fd08c;
const ATTACK_HINT_COLOR = 0xe0563f;
const ATTACK_HINT_SIZE = HEX_SIZE - 8;
const PLAN_COLORS = [0xf2d35c, 0x6fd08c, 0x5aa9e6, 0xe0a15a, 0xc77dff, 0x7bdff2];

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
  private plan: TurnPlan = createTurnPlan(this.turn);
  private timeline: TurnTimeline = { durationMs: 0, clips: [] };
  private previewMs: number | null = null;
  private playing = false;
  private playback: {
    timeline: TurnTimeline;
    elapsed: number;
    fired: Set<string>;
  } | null = null;
  private replayReady: Promise<string | null> = Promise.resolve(null);
  private readonly exploredByFaction = new Map<FactionId, Set<string>>();

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitLayer!: UnitLayer;
  private visionFog!: VisionFog;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private commandBar!: ScenarioCommandBar;
  private planner!: PlanTimeline;
  private recruitDialog!: RecruitDialog;
  private readonly planGhosts: Phaser.GameObjects.Image[] = [];
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
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.playerFaction = data?.playerFaction ?? 'blue';
    this.turn = createTurnState(this.playerFaction);
    this.state = beginTurn(ensureScenarioArmies(this.scenario.state), this.turn.faction);
    this.hover = null;
    this.selected = null;
    this.plan = createTurnPlan(this.turn);
    this.timeline = { durationMs: 0, clips: [] };
    this.previewMs = null;
    this.playing = false;
    this.playback = null;
    this.exploredByFaction.clear();
  }

  create(): void {
    installButtonClickSound(this);

    this.uiCamera = undefined;

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
      onEndTurn: () => this.playTurn(),
      onRecruit: () => {
        if (!this.playing) {
          this.recruitDialog.show(this.turn.faction);
        }
      },
      onScenarioMenu: () => this.scene.start('scenario-menu'),
      onMainMenu: () => this.scene.start('menu'),
    });
    this.planner = new PlanTimeline(this, {
      onToggle: () => this.clearPreview(),
      onPlay: () => this.playTurn(),
      onScrub: (timeMs) => this.setPreview(timeMs),
      onSelectUnit: (unitId) => this.selectById(unitId),
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
    this.refreshPlan();
    this.replayReady = this.beginReplay();

    (globalThis as { __mvawScene?: ScenarioScene }).__mvawScene = this;
  }

  update(_time: number, delta: number): void {
    this.unitLayer.update(delta);

    if (this.playback) {
      this.advancePlayback(delta);
      return;
    }

    if (this.recruitDialog?.isOpen || this.playing) {
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
      ...this.planner.uiObjects,
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
    const unit = this.selectedUnit();
    const planned = unit ? (planState(this.state, this.plan, unit.id) ?? unit) : null;

    this.commandBar.refreshUnit({
      selected: planned,
      state: this.state,
      planActions: unit ? unitActions(this.plan, unit.id) : [],
    });
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.playing) {
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

    this.handleMapClick(this.viewport.hexAt(pointer));
  }

  private handleMapClick(coord: HexCoord): void {
    const unit = this.selectedUnit();
    const target = visibleUnitAt(this.state, coord, this.turn.faction);

    if (unit && unit.faction === this.turn.faction) {
      if (target && target.faction !== unit.faction) {
        const result = addAttack(this.plan, this.state, unit.id, target.id);

        if (result.ok) {
          this.applyPlan(result.plan);
          return;
        }

        this.planner.notice(describePlanError(result.reason));
        return;
      }

      if (!target) {
        const result = setMove(this.plan, this.state, unit.id, coord);

        if (result.ok) {
          this.applyPlan(result.plan);
        } else {
          this.planner.notice(describePlanError(result.reason));
        }

        return;
      }
    }

    this.selectAt(coord);
  }

  private selectedUnit(): Unit | null {
    if (!this.selected) {
      return null;
    }

    return this.state.units.find((unit) => unit.id === this.selected?.id) ?? null;
  }

  private applyPlan(plan: TurnPlan): void {
    this.plan = plan;
    this.timeline = buildTimeline(this.plan, this.state);
    this.clearPreview();
    this.refreshPlan();
    this.drawSelection();
    this.drawRangeHints();
    this.drawPath();
    this.refreshHud();
    this.refreshUnitPreview();
  }

  private setPreview(timeMs: number): void {
    if (this.playing) {
      return;
    }

    this.previewMs = Math.max(0, Math.min(this.timeline.durationMs, timeMs));
    const frame = sampleTimeline(this.timeline, this.state, this.previewMs);

    this.unitLayer.setFramePositions(frame.units);
    this.hideGhosts();
    this.planner.setPlayhead(this.previewMs);
    this.refreshUnitPreview();
  }

  private clearPreview(): void {
    this.previewMs = null;
    this.unitLayer.resetPositions();
    this.planner.setPlayhead(0);
    this.drawPath();
  }

  private refreshPlan(): void {
    this.planner.refresh({
      turn: this.turn,
      state: this.state,
      plan: this.plan,
      timeline: this.timeline,
      selectedUnitId: this.selectedUnit()?.id ?? null,
      previewMs: this.previewMs,
    });
    this.cameras.main.ignore([...this.planner.uiObjects]);
  }

  private selectById(unitId: string): void {
    const unit = this.state.units.find((candidate) => candidate.id === unitId);

    if (unit) {
      this.selectAt(unit.pos);
    }
  }

  private playTurn(): void {
    if (this.playing) {
      return;
    }

    this.timeline = buildTimeline(this.plan, this.state);
    this.clearPreview();
    this.selected = null;
    this.selection.clear();
    this.rangeHints.clear();
    this.pathHints.clear();
    this.hideGhosts();
    this.refreshPlan();
    this.refreshUnitPreview();

    if (this.timeline.durationMs <= 0) {
      this.finishTurn();
      return;
    }

    this.playing = true;
    this.playback = {
      timeline: this.timeline,
      elapsed: 0,
      fired: new Set<string>(),
    };
    this.planner.setPlaying(true);
  }

  private advancePlayback(delta: number): void {
    const playback = this.playback;

    if (!playback) {
      return;
    }

    playback.elapsed = Math.min(playback.timeline.durationMs, playback.elapsed + delta);

    const frame = sampleTimeline(playback.timeline, this.state, playback.elapsed);

    this.unitLayer.setFramePositions(frame.units);

    for (const clip of frame.attacks) {
      const key = `${clip.unitId}:${clip.actionIndex}`;

      if (playback.fired.has(key)) {
        continue;
      }

      playback.fired.add(key);
      this.playAttackEffect(clip);
    }

    this.planner.setPlayhead(playback.elapsed);

    if (playback.elapsed >= playback.timeline.durationMs) {
      this.finishTurn();
    }
  }

  private playAttackEffect(clip: TimelineAttackClip): void {
    const attacker = this.state.units.find((unit) => unit.id === clip.unitId);

    playShotSound(attacker ? UNIT_DEFS[attacker.kind].weapon : undefined);
    playShotEffect(
      this,
      this.unitLayer.center(clip.attackerPos),
      this.unitLayer.center(clip.targetPos),
      () => playHitSound(),
      (object) => this.uiCamera?.ignore(object),
    );
  }

  private finishTurn(): void {
    const committed = commitPlan(this.state, this.plan);
    const finishedPlan = this.plan;
    const fallen = committed.killed
      .map((id) => this.state.units.find((unit) => unit.id === id))
      .filter((unit): unit is Unit => unit !== undefined);

    void this.saveTurn(finishedPlan, committed.state);

    this.state = committed.state;
    this.playing = false;
    this.playback = null;
    this.previewMs = null;
    this.selected = null;

    for (const unit of fallen) {
      playDeathSound(UNIT_DEFS[unit.kind].deathSound);
    }

    this.turn = nextTurn(this.turn);
    this.state = beginTurn(this.state, this.turn.faction);
    this.plan = createTurnPlan(this.turn);
    this.timeline = { durationMs: 0, clips: [] };

    this.selection.clear();
    this.rangeHints.clear();
    this.pathHints.clear();
    this.hideGhosts();
    this.planner.setPlaying(false);
    this.planner.setPlayhead(0);

    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshPlan();
  }

  private beginReplay(): Promise<string | null> {
    const id = createReplayId();

    return startReplay({
      id,
      scenarioId: this.scenario.id,
      scenarioName: this.scenario.name,
      playerFaction: this.playerFaction,
      state: this.state,
    })
      .then(() => id)
      .catch((error: unknown) => {
        console.warn('Nie udało się rozpocząć zapisu replayu', error);
        return null;
      });
  }

  private async saveTurn(plan: TurnPlan, stateAfter: GameState): Promise<void> {
    const replayId = await this.replayReady;

    if (!replayId) {
      return;
    }

    try {
      await recordTurnPlan(replayId, plan, stateAfter);
    } catch (error) {
      console.warn('Nie udało się zapisać planu tury', error);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.playing) {
      return;
    }

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
    this.planner.cancelScrub();
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

    if (this.playing) {
      return;
    }

    if (event.key === 'Escape') {
      this.scene.start(event.shiftKey ? 'menu' : 'scenario-menu');
      return;
    }

    if (event.key === 't' || event.key === 'T') {
      this.playTurn();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace' || event.key === 'x' || event.key === 'X') {
      const unit = this.selectedUnit();

      if (unit) {
        this.applyPlan(removeLastAction(this.plan, unit.id));
      }
    }
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private selectAt(coord: HexCoord): void {
    this.selected = visibleUnitAt(this.state, coord, this.turn.faction) ?? null;
    this.clearPreview();
    this.refreshSelection();
  }

  private refreshSelection(): void {
    this.drawSelection();
    this.drawRangeHints();
    this.drawPath();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshPlan();
  }

  private stateWithUnit(unit: Unit): GameState {
    return {
      ...this.state,
      units: this.state.units.map((candidate) =>
        candidate.id === unit.id ? unit : candidate,
      ),
    };
  }

  private drawSelection(): void {
    this.selection.clear();

    if (this.selected) {
      outlineHex(this.selection, this.mapView.center(this.selected.pos), 0xf2d35c, 3);
    }
  }

  private drawRangeHints(): void {
    this.rangeHints.clear();

    const unit = this.selectedUnit();

    if (!unit) {
      return;
    }

    const planned = planState(this.state, this.plan, unit.id) ?? unit;
    const rangeState = this.stateWithUnit(planned);
    const canStrike =
      unit.faction === this.turn.faction && canAttackThisTurn(planned);
    const canMove =
      unit.faction === this.turn.faction && !planned.hasActed && planned.movesLeft > 0;

    if (canMove) {
      for (const target of moveTargets(rangeState, planned)) {
        outlineHex(this.rangeHints, this.mapView.center(target), MOVE_HINT_COLOR, 2);
      }
    }

    if (canStrike && UNIT_DEFS[planned.kind].attackRange < FULL_MAP_RANGE) {
      for (const target of attackTiles(rangeState.map, planned)) {
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
        if (target.faction === planned.faction) {
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
    this.hideGhosts();

    if (this.plan.units.length === 0) {
      return;
    }

    const selectedId = this.selectedUnit()?.id ?? null;

    this.plan.units.forEach((unitPlan, index) => {
      const unit = this.state.units.find((candidate) => candidate.id === unitPlan.unitId);

      if (!unit) {
        return;
      }

      const color = PLAN_COLORS[index % PLAN_COLORS.length]!;
      const selected = selectedId === unit.id;
      const lineWidth = selected ? 3 : 2;

      for (const action of unitPlan.actions) {
        if (action.kind === 'move') {
          for (const coord of action.path) {
            outlineHex(this.pathHints, this.mapView.center(coord), color, lineWidth);
          }

          const end = action.path[action.path.length - 1];

          if (end) {
            outlineHex(this.pathHints, this.mapView.center(end), color, 4);
          }

          continue;
        }

        const target = this.state.units.find((candidate) => candidate.id === action.targetId);

        if (target) {
          outlineHex(
            this.pathHints,
            this.mapView.center(target.pos),
            ATTACK_HINT_COLOR,
            selected ? 4 : 3,
            ATTACK_HINT_SIZE,
          );
        }
      }

      const planned = planState(this.state, this.plan, unit.id);

      if (
        planned &&
        this.previewMs === null &&
        (planned.pos.col !== unit.pos.col || planned.pos.row !== unit.pos.row)
      ) {
        const center = this.mapView.center(planned.pos);
        const ghost = this.ghostFor(index);

        ghost
          .setTexture(unitTexture(this, unit.kind, unit.faction).key)
          .setPosition(center.x, center.y)
          .setAlpha(selected ? 0.65 : 0.45)
          .setVisible(true);
      }
    });
  }

  private ghostFor(index: number): Phaser.GameObjects.Image {
    const existing = this.planGhosts[index];

    if (existing) {
      return existing;
    }

    const ghost = this.add
      .image(0, 0, unitTexture(this, 'infantry', 'blue').key)
      .setDepth(3)
      .setAlpha(0.45)
      .setVisible(false);

    this.uiCamera?.ignore(ghost);
    this.planGhosts[index] = ghost;

    return ghost;
  }

  private hideGhosts(): void {
    for (const ghost of this.planGhosts) {
      ghost.setVisible(false);
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
    return (
      (this.recruitDialog?.isOpen ?? false) ||
      pointer.y >= this.scale.height - BAR_HEIGHT - (this.planner?.height ?? 0)
    );
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

function describePlanError(reason: PlanError): string {
  switch (reason) {
    case 'unreachable':
      return 'Nie można dojść w pozostałym budżecie ruchu';
    case 'occupied-target':
      return 'Inna jednostka kończy ruch na tym heksie';
    case 'no-shots':
      return 'Brak strzału — jednostka działała albo nie ma pocisków';
    case 'out-of-range':
      return 'Cel poza zasięgiem strzału';
    case 'friendly-target':
      return 'Nie można atakować własnej jednostki';
    case 'no-target':
      return 'Brak celu';
    case 'invalid-action':
      return 'Jednostka nie może już działać w tej turze';
    default:
      return 'Nie można zaplanować tej akcji';
  }
}
