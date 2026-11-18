import Phaser from 'phaser';
import { canAttackThisTurn } from '../core/combat';
import type { HexCoord } from '../core/map';
import { getMoveCost, IMPASSABLE, mapBounds, mapTileCount, moveTargets } from '../core/map';
import {
  BUILT_IN_SCENARIOS,
  ensureScenarioArmies,
  findRecruitSlot,
  recruitUnit,
  type ScenarioDefinition,
} from '../core/scenario';
import { placeUnit, type GameState } from '../core/state';
import {
  createRecruitment,
  purchaseUnit,
  type RecruitmentState,
} from '../core/recruitment';
import { attackTiles } from '../core/ranges';
import {
  addAttack,
  attackIntent,
  buildTimeline,
  boardingTarget,
  buildTurnLog,
  clearUnit,
  commitPlan,
  createTurnPlan,
  MOVE_STEP_MS,
  planningState,
  planState,
  removeActionFrom,
  removeLastAction,
  sampleTimeline,
  setMove,
  setUnload,
  transportClick,
  transportIntent,
  unitActions,
  type PlanError,
  type TimelineAttackClip,
  type TurnLog,
  type TransportIntent,
  type TurnPlan,
  type TurnTimeline,
} from '../core/plan';
import {
  beginTurn,
  createTurnState,
  nextTurn,
  type TurnState,
} from '../core/turn';
import {
  FULL_MAP_RANGE,
  UNIT_DEFS,
  type FactionId,
  type Unit,
  type UnitKind,
} from '../core/units';
import { visibleTileKeys, visibleUnitAt, visibleUnits, type VisionPoint } from '../core/vision';
import {
  activeTutorialHint,
  applyTutorialRewards,
  pendingTutorialRetirements,
  pendingTutorialSpawns,
  tutorialComplete,
  tutorialObjectiveStates,
  tutorialProgress,
  type TutorialProgress,
  type TutorialScript,
} from '../core/tutorial';
import { boardingPath, canBoard, cargoOf } from '../core/transport';
import { HexMapView, HEX_SIZE, outlineHex } from '../view/hexGrid';
import { MapViewport } from '../view/mapViewport';
import { MissionResult } from '../view/missionResult';
import { Minimap } from '../view/minimap';
import { ObjectivesPanel } from '../view/objectivesPanel';
import { PauseMenu } from '../view/pauseMenu';
import { PlanTimeline } from '../view/planTimeline';
import { ReplayBanner } from '../view/replayBanner';
import { RecruitDialog } from '../view/recruitDialog';
import { ScenarioCommandBar } from '../view/scenarioCommandBar';
import { BAR_HEIGHT } from '../view/hudLayout';
import { SpawnPointView } from '../view/spawnPoint';
import { installButtonClickSound } from '../view/buttonAudio';
import {
  playDeathSound,
  playHitSound,
  playMoveSound,
  playShotSound,
} from '../view/combatAudio';
import { preloadFogTile } from '../view/fogTile';
import { preloadRecruitPortraits } from '../view/recruitPortrait';
import { playShotEffect } from '../view/shotEffect';
import { playAirstrikeEffect, preloadAirstrikeCraft } from '../view/airstrikeEffect';
import { preloadTerrainTiles } from '../view/terrainTiles';
import { TutorialConfirm } from '../view/tutorialConfirm';
import { TutorialTip } from '../view/tutorialTip';
import { TransportIcons, type TransportBadge } from '../view/transportIcons';
import { TurnLogPanel } from '../view/turnLogPanel';
import { UnitLayer, unitTexture } from '../view/unitLayer';
import { VisionFog } from '../view/visionFog';
import {
  createReplayId,
  loadReplay,
  recordTurnPlan,
  startReplay,
  type StoredReplay,
} from '../storage/replays';
import { markMissionCompleted } from '../storage/progress';
import { buildSiPlan, type SiSpawns } from '../si';

const EDGE_PAN_MARGIN = 24;
const MOVE_HINT_COLOR = 0x6fd08c;
const ATTACK_HINT_COLOR = 0xe0563f;
const PENDING_ATTACK_COLOR = 0xffb347;
const BOARD_HINT_COLOR = 0x5aa9e6;
const ATTACK_HINT_SIZE = HEX_SIZE - 8;
const SHOT_LINE_DASH = 8;
const SHOT_LINE_GAP = 5;
const PLAN_COLORS = [0xf2d35c, 0x6fd08c, 0x5aa9e6, 0xe0a15a, 0xc77dff, 0x7bdff2];

interface ScenarioData {
  readonly definition?: ScenarioDefinition;
  readonly playerFaction?: FactionId;
  readonly returnScene?: string;
  readonly returnLabel?: string;
  readonly replay?: StoredReplay;
}

export class ScenarioScene extends Phaser.Scene {
  private scenario: ScenarioDefinition = BUILT_IN_SCENARIOS[0]!;
  private state: GameState = this.scenario.state;
  private turn: TurnState = createTurnState();
  private playerFaction: FactionId = 'blue';
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();

  private hover: HexCoord | null = null;
  private hoverUnitId: string | null = null;
  private selected: Unit | null = null;
  private armedTransport: TransportIntent | null = null;
  private plan: TurnPlan = createTurnPlan(this.turn);
  private pendingMove: {
    readonly unitId: string;
    readonly coord: HexCoord;
    readonly plan: TurnPlan;
  } | null = null;
  private pendingAttack: {
    readonly unitId: string;
    readonly targetId: string;
  } | null = null;
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
  private readonly shotFx = new Set<Phaser.GameObjects.GameObject>();
  private spawns: SiSpawns = new Map();
  private recruitment: RecruitmentState = createRecruitment();
  private recruitKind: UnitKind = 'infantry';
  private tutorialScript?: TutorialScript;
  private tutorialMoves = 0;
  private tutorialAttacks = 0;
  private tutorialBoarded = 0;
  private tutorialTankCol = 0;
  private tutorialSurvived = 0;
  private tutorialBazookaHits = 0;
  private tutorialReturned = false;
  private tutorialConfirmed = false;
  private tutorialRetirements = new Set<number>();
  private tutorialRewards = new Set<number>();
  private tutorialSpawnedUnits = new Map<number, string[]>();
  private returnScene = 'scenario-menu';
  private returnLabel = 'MENU SCENARIUSZY';
  private finished = false;
  private replay?: StoredReplay;
  private replayMode = false;
  private replayIndex = 0;
  private missionDamage = 0;
  private logs: TurnLog[] = [];
  private pendingSave: Promise<void> = Promise.resolve();

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private spawnView?: SpawnPointView;
  private unitLayer!: UnitLayer;
  private visionFog!: VisionFog;
  private tutorialTip!: TutorialTip;
  private tutorialConfirm!: TutorialConfirm;
  private missionResult!: MissionResult;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private commandBar!: ScenarioCommandBar;
  private planner!: PlanTimeline;
  private recruitDialog!: RecruitDialog;
  private turnLogPanel!: TurnLogPanel;
  private replayBanner!: ReplayBanner;
  private pauseMenu!: PauseMenu;
  private minimap!: Minimap;
  private objectivesPanel!: ObjectivesPanel;
  private transportIcons!: TransportIcons;
  private readonly planGhosts: Phaser.GameObjects.Image[] = [];
  private pendingGhost?: Phaser.GameObjects.Image;
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
    preloadRecruitPortraits(this);
    preloadAirstrikeCraft(this);
  }

  init(data: ScenarioData): void {
    this.scenario = data?.definition ?? BUILT_IN_SCENARIOS[0]!;
    this.playerFaction = data?.playerFaction ?? 'blue';
    this.replay = data?.replay;
    this.replayMode = this.replay !== undefined;

    if (this.replay) {
      const first = this.replay.plans[0];

      this.state = this.replay.initialState;
      this.turn = first
        ? { faction: first.faction, turn: first.turn }
        : createTurnState(this.playerFaction);
      this.logs = this.replay.plans.flatMap((entry) => (entry.log ? [entry.log] : []));
    } else {
      this.turn = createTurnState(this.playerFaction);
      this.state = beginTurn(
        ensureScenarioArmies(this.scenario.state, this.scenario.autoDeploy !== false),
        this.turn.faction,
      );
      this.logs = [];
    }

    this.replayIndex = 0;
    this.missionDamage = 0;
    this.pendingSave = Promise.resolve();
    this.spawns = new Map(
      this.state.units.map((unit) => [unit.id, { col: unit.pos.col, row: unit.pos.row }]),
    );
    this.hover = null;
    this.selected = null;
    this.plan = createTurnPlan(this.turn);
    this.timeline = { durationMs: 0, clips: [] };
    this.previewMs = null;
    this.playing = false;
    this.playback = null;
    this.pendingMove = null;
    this.pendingAttack = null;
    this.armedTransport = null;
    this.hoverUnitId = null;
    this.recruitment = createRecruitment(this.scenario.recruitment);
    this.recruitKind = this.recruitment.allowedKinds[0] ?? 'infantry';
    this.tutorialScript = this.scenario.tutorial;
    this.tutorialMoves = 0;
    this.tutorialAttacks = 0;
    this.tutorialBoarded = 0;
    this.tutorialTankCol = 0;
    this.tutorialSurvived = 0;
    this.tutorialBazookaHits = 0;
    this.tutorialReturned = false;
    this.tutorialConfirmed = false;
    this.tutorialRetirements = new Set();
    this.tutorialRewards = new Set();
    this.tutorialSpawnedUnits = new Map();
    this.returnScene = data?.returnScene ?? 'scenario-menu';
    this.returnLabel = data?.returnLabel ?? 'MENU SCENARIUSZY';
    this.finished = false;
    this.exploredByFaction.clear();
    this.shotFx.clear();
  }

  create(): void {
    installButtonClickSound(this);

    this.uiCamera = undefined;

    this.viewport = new MapViewport(this, this.state.map, {
      zoomMin: 0.6,
      zoomMax: 2.5,
      startZoom: 0.9,
      edgePanMargin: EDGE_PAN_MARGIN,
      edgePanBlocked: (pointer) =>
        this.pointerOverModal() || this.pointerOverCommandBar(pointer),
    });

    this.mapView = new HexMapView(this, this.state.map);
    this.spawnView = this.createSpawnView();
    this.unitLayer = new UnitLayer(this, visibleUnits(this.state, this.turn.faction, this.visionFor(this.turn.faction)));
    this.visionFog = new VisionFog(this, this.state.map);

    this.selection = this.add.graphics();
    this.selection.setDepth(4);
    this.rangeHints = this.add.graphics();
    this.rangeHints.setDepth(3);
    this.pathHints = this.add.graphics();
    this.pathHints.setDepth(6);
    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.tutorialTip = new TutorialTip(this);
    this.tutorialConfirm = new TutorialConfirm(this, {
      onConfirm: () => this.confirmTutorialBazooka(),
    });

    this.commandBar = new ScenarioCommandBar(this, {
      onEndTurn: () => this.playTurn(),
      onRecruit: () => {
        if (!this.playing) {
          this.recruitDialog.show(this.turn.faction, this.recruitment);
        }
      },
      onLog: () => this.openLogPanel(),
      onObjectives: () => this.openObjectives(),
      onAirstrike: () => this.startAirstrike(),
      onScenarioMenu: () => this.scene.start(this.returnScene),
      onMainMenu: () => this.scene.start('menu'),
      returnLabel: this.returnLabel,
    });
    this.planner = new PlanTimeline(this, {
      onToggle: () => this.clearPreview(),
      onPlay: () => this.playTurn(),
      onScrub: (timeMs) => this.setPreview(timeMs),
      onSelectUnit: (unitId) => this.selectById(unitId),
      onRemoveAction: (unitId, actionIndex) =>
        this.removePlannedAction(unitId, actionIndex),
      onRemoveLast: () => this.removeSelectedLastAction(),
    });
    this.recruitDialog = new RecruitDialog(this, {
      onRecruit: (kind) => this.recruit(kind),
      onSelectKind: (kind) => {
        this.recruitKind = kind;
        this.refreshHud();
      },
    });
    this.missionResult = new MissionResult(this, {
      onReturn: () => this.scene.start(this.returnScene),
      onMainMenu: () => this.scene.start('menu'),
      onReplay: () => {
        void this.openReplayFromStart();
      },
    });
    this.turnLogPanel = new TurnLogPanel(this, {
      onReplay: () => {
        void this.openReplayFromStart();
      },
      onClose: () => this.turnLogPanel.hide(),
    });
    this.replayBanner = new ReplayBanner(this);
    this.pauseMenu = new PauseMenu(this, {
      subtitle: this.scenario.name,
      onEndMission: () => this.scene.start(this.returnScene),
      onMainMenu: () => this.scene.start('menu'),
    });
    this.minimap = new Minimap(this);
    this.objectivesPanel = new ObjectivesPanel(this, {
      onClose: () => this.objectivesPanel.hide(),
    });
    this.transportIcons = new TransportIcons(this);

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

    const bounds = mapBounds(this.state.map);
    const start = this.scenario.spawn
      ? { col: this.scenario.spawn.col, row: this.scenario.spawn.row }
      : this.state.units.find((unit) => unit.faction === this.playerFaction)?.pos ??
        this.state.units.find((unit) => unit.faction === 'blue')?.pos ??
        (bounds
          ? {
              col: Math.floor((bounds.minCol + bounds.maxCol) / 2),
              row: Math.floor((bounds.minRow + bounds.maxRow) / 2),
            }
          : { col: 0, row: 0 });

    this.viewport.centerOn(start);
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshFog();
    this.refreshPlan();
    this.refreshTutorial();
    this.commandBar.setLogAvailability(this.logs.length > 0);
    this.replayReady = this.replayMode ? Promise.resolve(null) : this.beginReplay();

    if (this.replayMode) {
      this.startReplayPlayback();
    }

    (globalThis as { __mvawScene?: ScenarioScene }).__mvawScene = this;
  }

  update(_time: number, delta: number): void {
    this.refreshTransportIcons();
    this.minimap.update({
      map: this.state.map,
      units: this.replayMode
        ? this.state.units
        : visibleUnits(this.state, this.playerFaction, this.visionFor(this.playerFaction)),
      camera: this.cameras.main,
      bottomInset: this.replayMode ? 8 : BAR_HEIGHT + this.planner.height + 8,
      spawn: this.scenario.spawn
        ? { col: this.scenario.spawn.col, row: this.scenario.spawn.row }
        : undefined,
    });

    if (this.pauseMenu.isOpen) {
      return;
    }

    this.unitLayer.update(delta);

    if (this.finished) {
      return;
    }

    if (this.playback) {
      this.advancePlayback(delta);
      return;
    }

    if (this.recruitDialog?.isOpen || this.tutorialConfirm?.isOpen || this.playing || this.replayMode) {
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
      ...this.tutorialTip.uiObjects,
      ...this.tutorialConfirm.uiObjects,
      ...this.missionResult.uiObjects,
      ...this.turnLogPanel.uiObjects,
      ...this.replayBanner.uiObjects,
      ...this.pauseMenu.uiObjects,
      ...this.minimap.uiObjects,
      ...this.objectivesPanel.uiObjects,
      ...this.transportIcons.uiObjects,
    ]);
    uiCamera.ignore([
      this.cursor,
      this.selection,
      this.rangeHints,
      this.pathHints,
      ...(this.spawnView?.objects ?? []),
      ...this.mapView.objects(),
      ...this.unitLayer.objects(),
      ...this.visionFog.objects,
    ]);

    this.uiCamera = uiCamera;
  }

  private createSpawnView(): SpawnPointView | undefined {
    const spawn = this.scenario.spawn;

    if (!spawn) {
      return undefined;
    }

    return new SpawnPointView(
      this,
      this.mapView.center({ col: spawn.col, row: spawn.row }),
      HEX_SIZE,
      this.playerFaction,
    );
  }

  private visionFor(faction: FactionId): VisionPoint | undefined {
    const spawn = this.scenario.spawn;

    if (!spawn || faction !== this.playerFaction) {
      return undefined;
    }

    return { pos: { col: spawn.col, row: spawn.row }, range: spawn.vision };
  }

  private refreshUnits(): void {
    this.unitLayer.setUnits(
      this.replayMode
        ? this.state.units
        : visibleUnits(this.state, this.playerFaction, this.visionFor(this.playerFaction)),
    );
    this.uiCamera?.ignore(this.unitLayer.objects());
    this.refreshFog();
  }

  private refreshFog(): void {
    if (this.replayMode || !this.state.map.fogOfWar) {
      this.visionFog.hide();
      return;
    }

    const visible = visibleTileKeys(
      this.state,
      this.playerFaction,
      this.visionFor(this.playerFaction),
    );
    const explored =
      this.exploredByFaction.get(this.playerFaction) ?? new Set<string>();

    for (const key of visible) {
      explored.add(key);
    }

    this.exploredByFaction.set(this.playerFaction, explored);

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
    if (this.playing || this.finished || this.replayMode || this.turnLogPanel.isOpen) {
      return;
    }

    if (this.pointerOverModal() || this.pointerOverCommandBar(pointer)) {
      return;
    }

    if (this.minimap.contains(pointer.x, pointer.y)) {
      return;
    }

    if (this.viewport.startPan(pointer)) {
      return;
    }

    if (this.pointerOverPlanner(pointer)) {
      return;
    }

    if (pointer.button === 2) {
      this.handleRightClick(pointer);
      return;
    }

    if (pointer.button !== 0) {
      return;
    }

    if (this.armedTransport && this.transportIcons.hitAt(pointer.x, pointer.y)) {
      this.applyArmedTransport();
      return;
    }

    this.armedTransport = null;
    this.refreshTransportIcons();
    this.handleMapClick(this.viewport.hexAt(pointer));
  }

  private handleRightClick(pointer: Phaser.Input.Pointer): void {
    const coord = this.viewport.hexAt(pointer);
    let unit = this.selectedUnit();
    const target = visibleUnitAt(
      this.state,
      coord,
      this.turn.faction,
      this.visionFor(this.turn.faction),
    );

    if (unit && target && target.faction !== unit.faction) {
      if (this.pendingMove?.unitId === unit.id) {
        this.applyPlan(this.pendingMove.plan);
        unit = this.selectedUnit();
      }

      const intent = attackIntent(this.plan, this.state, unit, target);

      if (!intent) {
        this.clearSelection();
        return;
      }

      this.armedTransport = null;
      this.transportIcons.hide();
      this.pendingAttack = intent;
      this.drawPath();
      this.planner.notice('Prawy przycisk wyznaczył cel — kliknij wroga lewym, aby potwierdzić atak');
      return;
    }

    const intent = transportIntent(this.plan, this.state, unit, coord);
    const result = intent ? transportClick(this.plan, this.state, unit, coord) : null;

    if (!intent || !result?.ok) {
      this.clearSelection();
      return;
    }

    this.armedTransport = intent;
    this.refreshTransportIcons();
    this.planner.notice(
      intent.kind === 'board'
        ? 'Kliknij ikonę ↓, aby potwierdzić wsiadanie'
        : 'Kliknij ikonę ↑, aby potwierdzić wysiadanie',
    );
  }

  private applyArmedTransport(): void {
    const intent = this.armedTransport;

    if (!intent) {
      return;
    }

    const result = transportClick(this.plan, this.state, this.selectedUnit(), intent.coord);

    this.armedTransport = null;
    this.refreshTransportIcons();

    if (!result?.ok) {
      this.planner.notice(
        result?.reason === 'unreachable'
          ? 'Piechur nie dojdzie do czołgu w tej turze. Przybliż piechura do pojazdu'
          : describePlanError(result?.reason ?? 'invalid-action'),
      );
      return;
    }

    this.applyPlan(result.plan);
  }

  private handleMapClick(coord: HexCoord): void {
    const unit = this.selectedUnit();
    const target = visibleUnitAt(
      this.state,
      coord,
      this.turn.faction,
      this.visionFor(this.turn.faction),
    );

    if (unit && unit.faction === this.turn.faction) {
      if (target && target.faction !== unit.faction) {
        if (this.pendingMove?.unitId === unit.id) {
          this.applyPlan(this.pendingMove.plan);
        }

        const result = addAttack(this.plan, this.state, unit.id, target.id);

        if (!result.ok) {
          this.clearSelection();
          return;
        }

        if (this.pendingAttack?.unitId === unit.id && this.pendingAttack.targetId === target.id) {
          this.applyPlan(result.plan);
          return;
        }

        this.pendingAttack = { unitId: unit.id, targetId: target.id };
        this.drawPath();
        this.planner.notice('Kliknij wroga ponownie, aby potwierdzić atak');
        return;
      }

      if (target) {
        this.selectAt(coord);
        return;
      }

      const result = setMove(this.plan, this.state, unit.id, coord);

      if (!result.ok) {
        this.clearSelection();
        return;
      }

      if (
        this.pendingMove?.unitId === unit.id &&
        this.pendingMove.coord.col === coord.col &&
        this.pendingMove.coord.row === coord.row
      ) {
        this.applyPlan(result.plan);
        return;
      }

      this.pendingAttack = null;
      this.pendingMove = { unitId: unit.id, coord, plan: result.plan };
      this.drawPath();
      this.planner.notice('Kliknij ten heks ponownie, aby potwierdzić ruch');
      return;
    }

    this.selectAt(coord);
  }

  private removeSelectedLastAction(): void {
    const unit = this.selectedUnit();

    if (!unit) {
      this.planner.notice('Wybierz jednostkę, której akcję chcesz usunąć');
      return;
    }

    if (unitActions(this.plan, unit.id).length === 0) {
      this.planner.notice('Wybrana jednostka nie ma zaplanowanych akcji');
      return;
    }

    this.applyPlan(removeLastAction(this.plan, unit.id));
  }

  private removePlannedAction(unitId: string, actionIndex: number): void {
    const actions = unitActions(this.plan, unitId);

    if (actionIndex < 0 || actionIndex >= actions.length) {
      return;
    }

    this.applyPlan(removeActionFrom(this.plan, unitId, actionIndex));
  }

  private selectedUnit(): Unit | null {
    if (!this.selected) {
      return null;
    }

    return this.state.units.find((unit) => unit.id === this.selected?.id) ?? null;
  }

  private hoveredUnit(): Unit | null {
    if (!this.hover) {
      return null;
    }

    return (
      visibleUnitAt(
        this.state,
        this.hover,
        this.playerFaction,
        this.visionFor(this.playerFaction),
      ) ?? null
    );
  }

  private boardingCandidate(): { passenger: Unit; vehicle: Unit; path: HexCoord[] } | null {
    const hovered = this.hoveredUnit();
    const selected = this.selectedUnit();

    if (!hovered || !selected || hovered.id === selected.id) {
      return null;
    }

    const base = planningState(this.state, removeActionFrom(this.plan, hovered.id, 0));
    const passenger = base.units.find((candidate) => candidate.id === selected.id);
    const vehicle = base.units.find((candidate) => candidate.id === hovered.id);

    if (!passenger || !vehicle || !canBoard(vehicle, passenger)) {
      return null;
    }

    const path = boardingPath(base, passenger, vehicle);

    return path ? { passenger, vehicle, path } : null;
  }

  private refreshTransportHint(): void {
    const candidate = this.boardingCandidate();

    if (candidate) {
      this.planner.notice(
        `${UNIT_DEFS[candidate.vehicle.kind].label} może zabrać ${UNIT_DEFS[
          candidate.passenger.kind
        ].label.toLowerCase()} — PPM na pojazd, aby pokazać ikonę wsiadania`,
      );
      return;
    }

    const selected = this.selectedUnit();

    if (!selected || !this.hover || unitActions(this.plan, selected.id).length > 0) {
      return;
    }

    const passenger = cargoOf(selected)[0];

    if (!passenger) {
      return;
    }

    if (setUnload(this.plan, this.state, selected.id, passenger.id, this.hover).ok) {
      this.planner.notice('PPM na ten heks, aby pokazać ikonę wysiadania');
    }
  }

  private applyPlan(plan: TurnPlan): void {
    this.plan = plan;
    this.pendingMove = null;
    this.pendingAttack = null;
    this.armedTransport = null;
    this.transportIcons.hide();
    this.timeline = buildTimeline(this.plan, this.state);
    this.clearPreview();
    this.refreshPlan();
    this.refreshHiddenUnits();
    this.drawSelection();
    this.drawRangeHints();
    this.drawPath();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshTutorial();
  }

  private recruit(kind: UnitKind): boolean {
    if (this.finished || this.playing || this.turn.faction !== this.playerFaction) {
      return false;
    }

    const next = purchaseUnit(this.recruitment, kind);

    if (!next) {
      return false;
    }

    const result = recruitUnit(
      this.state,
      this.turn.faction,
      kind,
      this.scenario.spawn
        ? { col: this.scenario.spawn.col, row: this.scenario.spawn.row }
        : undefined,
    );

    if (!result) {
      return false;
    }

    this.recruitment = next;
    this.state = result.state;
    this.spawns = new Map([...this.spawns, [result.unitId, result.coord]]);
    this.syncRecruitKind();
    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshPlan();
    this.refreshTutorial();

    if (this.finished) {
      return true;
    }

    this.drawPath();
    this.planner.notice(`${UNIT_DEFS[kind].label} dołącza do armii`);
    return true;
  }

  private syncRecruitKind(): void {
    if (!this.recruitment.allowedKinds.includes(this.recruitKind)) {
      this.recruitKind = this.recruitment.allowedKinds[0] ?? this.recruitKind;
    }
  }

  private setPreview(timeMs: number): void {
    if (this.playing) {
      return;
    }

    if (this.pendingMove || this.pendingAttack || this.armedTransport) {
      this.pendingMove = null;
      this.pendingAttack = null;
      this.armedTransport = null;
      this.transportIcons.hide();
      this.drawPath();
    }

    this.previewMs = Math.max(0, Math.min(this.timeline.durationMs, timeMs));
    const frame = sampleTimeline(this.timeline, this.state, this.previewMs);

    this.unitLayer.setFramePositions(frame.units);
    this.hideGhosts();
    this.refreshHiddenUnits(this.previewMs);
    this.planner.setPlayhead(this.previewMs);
    this.refreshUnitPreview();
  }

  private clearPreview(): void {
    this.previewMs = null;
    this.unitLayer.resetPositions();
    this.refreshHiddenUnits();
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
    if (this.playing || this.finished || this.replayMode) {
      return;
    }

    this.timeline = buildTimeline(this.plan, this.state);
    this.pendingMove = null;
    this.pendingAttack = null;
    this.armedTransport = null;
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
    this.refreshHiddenUnits(0);
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
    this.refreshHiddenUnits(playback.elapsed);

    for (const clip of playback.timeline.clips) {
      if (clip.kind !== 'move' || playback.elapsed < clip.startMs) {
        continue;
      }

      const mover = this.state.units.find((unit) => unit.id === clip.unitId);
      const sound = mover ? UNIT_DEFS[mover.kind].moveSound : undefined;

      if (!sound) {
        continue;
      }

      const steps = Math.min(
        clip.path.length,
        Math.floor((playback.elapsed - clip.startMs) / MOVE_STEP_MS) + 1,
      );

      for (let step = 0; step < steps; step += 1) {
        const key = `move:${clip.unitId}:${clip.actionIndex}:${step}`;

        if (playback.fired.has(key)) {
          continue;
        }

        playback.fired.add(key);
        playMoveSound(sound);
      }
    }

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
      if (this.replayMode) {
        this.finishReplayTurn();
      } else {
        this.finishTurn();
      }
    }
  }

  private playAttackEffect(clip: TimelineAttackClip): void {
    const attacker = this.state.units.find((unit) => unit.id === clip.unitId);
    const to = this.unitLayer.center(clip.targetPos);
    const registerFx = (object: Phaser.GameObjects.GameObject): void => {
      this.uiCamera?.ignore(object);
      this.shotFx.add(object);
      object.once('destroy', () => this.shotFx.delete(object));
    };

    playShotSound(attacker ? UNIT_DEFS[attacker.kind].weapon : undefined);

    if (attacker?.kind === 'bomber') {
      const bounds = mapBounds(this.state.map);
      const from = bounds
        ? this.unitLayer.center({ col: bounds.minCol, row: clip.targetPos.row })
        : this.unitLayer.center(clip.attackerPos);

      playAirstrikeEffect(
        this,
        { x: from.x - 80, y: from.y },
        to,
        () => playHitSound(),
        registerFx,
      );
      return;
    }

    playShotEffect(
      this,
      this.unitLayer.center(clip.attackerPos),
      to,
      () => playHitSound(),
      registerFx,
    );
  }

  private finishTurn(): void {
    const committed = commitPlan(this.state, this.plan);
    const finishedPlan = this.plan;
    const log = buildTurnLog(finishedPlan, this.state, committed);
    const wasPlayerTurn = this.turn.faction === this.playerFaction;
    const fallen = committed.killed
      .map((id) => this.state.units.find((unit) => unit.id === id))
      .filter((unit): unit is Unit => unit !== undefined);

    this.logs.push(log);

    if (finishedPlan.faction === this.playerFaction) {
      this.missionDamage += log.damageTotal;
    }

    const tankIds = new Set(
      this.state.units
        .filter((unit) => unit.faction === this.playerFaction && unit.kind === 'tank')
        .map((unit) => unit.id),
    );
    const hitsOnTank = committed.hits.filter((hit) => tankIds.has(hit.targetId));
    const enemyHitTank = !wasPlayerTurn && hitsOnTank.length > 0;

    if (!wasPlayerTurn) {
      this.tutorialBazookaHits += hitsOnTank.filter(
        (hit) => this.state.units.find((unit) => unit.id === hit.attackerId)?.kind === 'bazooka',
      ).length;
    }

    this.state = committed.state;

    if (wasPlayerTurn) {
      const executed = tutorialProgress(this.recruitment, finishedPlan, {
        state: this.state,
        tankFaction: this.playerFaction,
        base: this.scenario.spawn
          ? { col: this.scenario.spawn.col, row: this.scenario.spawn.row }
          : undefined,
        bazookaHits: this.tutorialBazookaHits,
      });

      this.tutorialMoves += executed.moves;
      this.tutorialAttacks += executed.attacks;
      this.tutorialBoarded += executed.boarded;
      this.tutorialTankCol = Math.max(this.tutorialTankCol, executed.tankCol);
      this.tutorialReturned = this.tutorialReturned || executed.returned;
    }

    if (enemyHitTank) {
      this.tutorialSurvived += 1;
    }

    this.applyTutorialRetirements();
    this.applyTutorialSpawns();

    const savedState = this.state;

    this.pendingSave = this.pendingSave
      .then(() => this.saveTurn(finishedPlan, savedState, log))
      .catch((error) => {
        console.warn('Nie udało się zapisać planu tury', error);
      });

    this.playing = false;
    this.playback = null;
    this.previewMs = null;
    this.pendingMove = null;
    this.pendingAttack = null;
    this.armedTransport = null;
    this.selected = null;
    this.hover = null;
    this.hoverUnitId = null;
    this.cursor.clear();

    for (const unit of fallen) {
      playDeathSound(UNIT_DEFS[unit.kind].deathSound);
    }

    this.selection.clear();
    this.rangeHints.clear();
    this.pathHints.clear();
    this.hideGhosts();
    this.clearShotFx();
    this.planner.setPlaying(false);
    this.planner.setPlayhead(0);
    this.planner.setCollapsed(true);
    this.commandBar.setLogAvailability(true);

    const enemyLeft = this.state.units.some((unit) => unit.faction !== this.playerFaction);

    if (wasPlayerTurn && !enemyLeft && !this.scenario.sandbox) {
      this.finishMission();
      return;
    }

    const keepPlayerTurn = wasPlayerTurn && this.scenario.sandbox && !enemyLeft;

    this.turn = keepPlayerTurn
      ? { faction: this.turn.faction, turn: this.turn.turn + 1 }
      : nextTurn(this.turn);
    this.state = beginTurn(this.state, this.turn.faction);
    this.plan = createTurnPlan(this.turn);
    this.timeline = { durationMs: 0, clips: [] };

    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshPlan();
    this.refreshTutorial();

    if (this.turn.faction !== this.playerFaction) {
      this.beginSiTurn();
    }
  }

  private finishMission(): void {
    this.finished = true;
    if (!this.replayMode) {
      markMissionCompleted(this.scenario.id);
    }
    this.plan = createTurnPlan(this.turn);
    this.timeline = { durationMs: 0, clips: [] };
    this.recruitDialog.hide();
    this.tutorialTip.hide();
    this.tutorialConfirm.hide();

    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
    this.refreshPlan();

    this.time.delayedCall(420, () => {
      if (this.finished) {
        this.missionResult.show(
          this.scenario.name,
          this.returnLabel,
          this.missionDamage,
          !this.replayMode && this.logs.length > 0,
        );
      }
    });
  }

  private clearShotFx(): void {
    for (const object of this.shotFx) {
      object.destroy();
    }

    this.shotFx.clear();
  }

  private beginSiTurn(): void {
    let plan = buildSiPlan(this.state, this.turn, this.spawns);

    if (this.scenario.id === 'tutorial-ruch-jednostek') {
      const bazooka = this.state.units.find(
        (unit) => unit.kind === 'bazooka' && unit.faction !== this.playerFaction,
      );
      const tank = this.state.units.find(
        (unit) => unit.kind === 'tank' && unit.faction === this.playerFaction,
      );

      if (bazooka && tank) {
        const attack = addAttack(clearUnit(plan, bazooka.id), this.state, bazooka.id, tank.id);
        if (attack.ok) {
          plan = attack.plan;
        }
      }
    }

    this.plan = plan;
    this.timeline = buildTimeline(this.plan, this.state);
    this.refreshPlan();
    this.playTurn();
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

  private async saveTurn(plan: TurnPlan, stateAfter: GameState, log: TurnLog): Promise<void> {
    const replayId = await this.replayReady;

    if (!replayId) {
      return;
    }

    try {
      await recordTurnPlan(replayId, plan, stateAfter, log);
    } catch (error) {
      console.warn('Nie udało się zapisać planu tury', error);
    }
  }

  private openObjectives(): void {
    if (this.playing || this.replayMode) {
      return;
    }

    this.objectivesPanel.show({
      name: this.scenario.name,
      description: this.scenario.description,
      steps: tutorialObjectiveStates(this.tutorialScript, this.tutorialProgressNow()),
    });
  }

  private refreshTransportIcons(): void {
    const intent = this.armedTransport;

    if (!intent || this.playing || this.replayMode || this.finished || this.pauseMenu.isOpen) {
      this.transportIcons.hide();
      return;
    }

    const camera = this.cameras.main;
    const center = this.mapView.center(intent.coord);
    const badge: TransportBadge = {
      kind: intent.kind,
      x: (center.x - camera.worldView.x) * camera.zoom,
      y: (center.y - camera.worldView.y) * camera.zoom,
      label: intent.kind === 'board' ? '↓' : '↑',
      passengerId: intent.passengerId,
      vehicleId: intent.vehicleId,
      target: intent.kind === 'unload' ? intent.target : undefined,
    };

    this.transportIcons.show([badge]);
  }

  private refreshHiddenUnits(ms?: number): void {
    const hidden = new Set<string>();

    if (ms !== undefined) {
      for (const unitPlan of this.plan.units) {
        if (!boardingTarget(unitPlan.actions)) {
          continue;
        }

        const clips = this.timeline.clips.filter((clip) => clip.unitId === unitPlan.unitId);
        const end = clips.reduce((latest, clip) => Math.max(latest, clip.endMs), 0);

        if (ms >= end) {
          hidden.add(unitPlan.unitId);
        }
      }
    }

    this.unitLayer.setHidden(hidden);
  }

  private openLogPanel(): void {
    if (this.playing || this.replayMode) {
      return;
    }

    this.clearPreview();
    this.turnLogPanel.show(this.logs, this.logs.length > 0);
  }

  private async openReplayFromStart(): Promise<void> {
    await this.pendingSave;
    const replay = this.replay ?? (await this.loadReplayForRestart());

    if (!replay || replay.plans.length === 0) {
      this.turnLogPanel.hide();
      this.replayBanner.show('BRAK ZAPISU REPLAY DO ODTWORZENIA');
      this.time.delayedCall(2600, () => {
        if (!this.replayMode) {
          this.replayBanner.hide();
        }
      });
      return;
    }

    this.turnLogPanel.hide();
    this.missionResult.hide();
    this.scene.restart({
      definition: this.scenario,
      playerFaction: this.playerFaction,
      returnScene: this.returnScene,
      returnLabel: this.returnLabel,
      replay,
    });
  }

  private async loadReplayForRestart(): Promise<StoredReplay | undefined> {
    await this.pendingSave;
    const replayId = await this.replayReady;

    if (!replayId) {
      return undefined;
    }

    return loadReplay(replayId);
  }

  private startReplayPlayback(): void {
    this.commandBar.setVisible(false);
    this.planner.setVisible(false);
    this.tutorialTip.hide();
    this.tutorialConfirm.hide();

    if (!this.replay || this.replay.plans.length === 0) {
      this.replayBanner.show('BRAK ZAPISU REPLAY — ESC: POWRÓT');
      return;
    }

    this.replayIndex = 0;
    this.playReplayEntry(0);
  }

  private playReplayEntry(index: number): void {
    const replay = this.replay;
    const entry = replay?.plans[index];

    if (!replay || !entry) {
      this.finishReplayPlayback();
      return;
    }

    this.replayIndex = index;
    this.state = beginTurn(index === 0 ? replay.initialState : this.state, entry.faction);
    this.turn = { faction: entry.faction, turn: entry.turn };
    this.plan = entry.plan;
    this.timeline = buildTimeline(this.plan, this.state);
    this.armedTransport = null;
    this.transportIcons.hide();
    this.selected = null;
    this.hover = null;
    this.hoverUnitId = null;
    this.previewMs = null;
    this.cursor.clear();
    this.selection.clear();
    this.rangeHints.clear();
    this.pathHints.clear();
    this.hideGhosts();
    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();
    this.replayBanner.show(`REPLAY CAŁEJ GRY — TURA ${index + 1}/${replay.plans.length}`);

    if (this.timeline.durationMs <= 0) {
      this.finishReplayTurn();
      return;
    }

    this.playing = true;
    this.playback = {
      timeline: this.timeline,
      elapsed: 0,
      fired: new Set<string>(),
    };
  }

  private finishReplayTurn(): void {
    const replay = this.replay;
    const entry = replay?.plans[this.replayIndex];

    this.playing = false;
    this.playback = null;

    if (entry) {
      this.state = entry.stateAfter;
    }

    this.refreshUnits();
    this.refreshHud();
    this.refreshUnitPreview();

    const next = this.replayIndex + 1;

    if (!replay || next >= replay.plans.length) {
      this.finishReplayPlayback();
      return;
    }

    this.replayIndex = next;
    this.time.delayedCall(600, () => {
      if (this.replayMode) {
        this.playReplayEntry(next);
      }
    });
  }

  private finishReplayPlayback(): void {
    this.playing = false;
    this.playback = null;
    this.unitLayer.resetPositions();
    this.refreshUnits();
    this.replayBanner.show(`REPLAY ZAKOŃCZONY — ESC: ${this.returnLabel}`);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.playing || this.finished || this.replayMode || this.pointerOverModal()) {
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

        if (this.hoverUnitId !== null) {
          this.hoverUnitId = null;
          this.drawRangeHints();
        }
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

    const hoveredId = this.hoveredUnit()?.id ?? null;

    if (hoveredId !== this.hoverUnitId) {
      this.hoverUnitId = hoveredId;
      this.drawRangeHints();
    }

    this.refreshTransportHint();
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
    if (this.pauseMenu.isOpen) {
      if (event.key === 'Escape') {
        this.pauseMenu.hide();
      }

      return;
    }

    if (this.turnLogPanel.isOpen) {
      if (event.key === 'Escape') {
        this.turnLogPanel.hide();
      }

      return;
    }

    if (this.objectivesPanel.isOpen) {
      if (event.key === 'Escape') {
        this.objectivesPanel.hide();
      }

      return;
    }

    if (this.tutorialConfirm.isOpen) {
      return;
    }

    if (this.replayMode) {
      if (event.key === 'Escape') {
        this.scene.start(this.returnScene);
      }

      return;
    }

    if (this.recruitDialog.isOpen) {
      if (event.key === 'Escape') {
        this.recruitDialog.hide();
      }

      return;
    }

    if (this.finished) {
      return;
    }

    if (event.key === 'Escape') {
      this.pauseMenu.show();
      return;
    }

    if (this.playing) {
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

  private startAirstrike(): void {
    if (this.playing || this.finished || this.replayMode || this.turnLogPanel.isOpen) {
      return;
    }

    const bomber = this.state.units.find(
      (unit) =>
        unit.faction === this.turn.faction &&
        unit.kind === 'bomber' &&
        canAttackThisTurn(unit),
    );

    if (!bomber) {
      this.planner.notice('Brak gotowego bombowca — kup bombera w oknie KUP');
      return;
    }

    this.selectAt(bomber.pos);
    this.planner.notice('Wybierz cel nalotu — kliknij wroga dwukrotnie');
  }

  private selectAt(coord: HexCoord): void {
    this.selectUnit(
      visibleUnitAt(
        this.state,
        coord,
        this.turn.faction,
        this.visionFor(this.turn.faction),
      ) ?? null,
    );
  }

  private clearSelection(): void {
    this.selectUnit(null);
  }

  private selectUnit(unit: Unit | null): void {
    this.selected = unit;
    this.armedTransport = null;
    this.pendingMove = null;
    this.pendingAttack = null;
    this.transportIcons.hide();
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

    const hovered = this.hoveredUnit();
    this.hoverUnitId = hovered?.id ?? null;
    const unit = hovered ?? this.selectedUnit();

    if (!unit) {
      return;
    }

    const own = unit.faction === this.turn.faction;
    const rangeState = own ? planningState(this.state, this.plan) : this.stateWithUnit(unit);
    const planned = own
      ? (rangeState.units.find((candidate) => candidate.id === unit.id) ?? unit)
      : unit;
    const canStrike = own
      ? canAttackThisTurn(planned)
      : UNIT_DEFS[planned.kind].attackRange > 0;
    const canMove = own && !planned.hasActed && planned.movesLeft > 0;

    const board = this.boardingCandidate();

    if (board) {
      this.drawDashedLine(
        this.mapView.center(board.passenger.pos),
        this.mapView.center(board.vehicle.pos),
        2,
        0.75,
        BOARD_HINT_COLOR,
      );
      outlineHex(this.rangeHints, this.mapView.center(board.vehicle.pos), BOARD_HINT_COLOR, 4);
    }

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
      for (const target of visibleUnits(
        this.state,
        this.turn.faction,
        this.visionFor(this.turn.faction),
      )) {
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

    if (this.plan.units.length === 0 && !this.pendingMove && !this.pendingAttack) {
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
      let from = unit.pos;

      for (const action of unitPlan.actions) {
        if (action.kind === 'move' || action.kind === 'board') {
          for (const coord of action.path) {
            outlineHex(this.pathHints, this.mapView.center(coord), color, lineWidth);
          }

          this.drawMovementArrows(from, action.path, color, lineWidth);

          const end = action.path[action.path.length - 1];

          if (end) {
            outlineHex(this.pathHints, this.mapView.center(end), color, 4);

            if (action.kind === 'board') {
              outlineHex(this.pathHints, this.mapView.center(end), BOARD_HINT_COLOR, 6);
            }

            from = end;
          }

          continue;
        }

        if (action.kind === 'unload') {
          outlineHex(this.pathHints, this.mapView.center(action.target), BOARD_HINT_COLOR, 4);
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

    this.drawShotLines(selectedId);
    this.drawPendingMove();
    this.drawPendingAttack();
  }

  private drawPendingMove(): void {
    const pending = this.pendingMove;

    if (!pending) {
      return;
    }

    const unit = this.state.units.find((candidate) => candidate.id === pending.unitId);

    if (!unit) {
      return;
    }

    const actions = unitActions(pending.plan, pending.unitId);
    const action = actions[actions.length - 1];

    if (!action || action.kind !== 'move') {
      return;
    }

    const planIndex = this.plan.units.findIndex(
      (candidate) => candidate.unitId === pending.unitId,
    );
    const color =
      PLAN_COLORS[(planIndex === -1 ? this.plan.units.length : planIndex) % PLAN_COLORS.length]!;

    for (const coord of action.path) {
      outlineHex(this.pathHints, this.mapView.center(coord), color, 2);
    }

    this.drawMovementArrows(unit.pos, action.path, color, 2);

    const end = action.path[action.path.length - 1];

    if (!end) {
      return;
    }

    outlineHex(this.pathHints, this.mapView.center(end), color, 4);
    this.showPendingGhost(unit, end);
  }

  private drawPendingAttack(): void {
    const pending = this.pendingAttack;

    if (!pending) {
      return;
    }

    const unit = this.state.units.find((candidate) => candidate.id === pending.unitId);
    const target = this.state.units.find((candidate) => candidate.id === pending.targetId);

    if (!unit || !target) {
      return;
    }

    const planned = planState(this.state, this.plan, unit.id) ?? unit;
    const from = this.mapView.center(planned.pos);
    const to = this.mapView.center(target.pos);

    this.drawDashedLine(from, to, 2.5, 0.9, PENDING_ATTACK_COLOR);
    outlineHex(this.pathHints, to, PENDING_ATTACK_COLOR, 3, ATTACK_HINT_SIZE);
  }

  private showPendingGhost(unit: Unit, coord: HexCoord): void {
    if (!this.pendingGhost) {
      this.pendingGhost = this.add
        .image(0, 0, unitTexture(this, 'infantry', 'blue').key)
        .setDepth(3)
        .setAlpha(0.35)
        .setVisible(false);

      this.uiCamera?.ignore(this.pendingGhost);
    }

    const center = this.mapView.center(coord);

    this.pendingGhost
      .setTexture(unitTexture(this, unit.kind, unit.faction).key)
      .setPosition(center.x, center.y)
      .setAlpha(0.35)
      .setVisible(true);
  }

  private drawMovementArrows(
    from: HexCoord,
    path: readonly HexCoord[],
    color: number,
    width: number,
  ): void {
    let start = this.mapView.center(from);

    for (const coord of path) {
      const end = this.mapView.center(coord);
      this.drawMovementArrow(start, end, color, width);
      start = end;
    }
  }

  private drawMovementArrow(
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: number,
    width: number,
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      return;
    }

    const ux = dx / length;
    const uy = dy / length;
    const startX = from.x + ux * HEX_SIZE * 0.34;
    const startY = from.y + uy * HEX_SIZE * 0.34;
    const endX = to.x - ux * HEX_SIZE * 0.2;
    const endY = to.y - uy * HEX_SIZE * 0.2;

    this.pathHints.lineStyle(width + 2, 0x05080c, 0.55);
    this.pathHints.lineBetween(startX, startY, endX, endY);
    this.pathHints.lineStyle(width, color, 1);
    this.pathHints.lineBetween(startX, startY, endX, endY);

    const head = Math.max(7, width * 2.6);
    const angle = Math.atan2(dy, dx);
    const spread = 0.55;

    this.pathHints.fillStyle(color, 1);
    this.pathHints.fillTriangle(
      endX,
      endY,
      endX - head * Math.cos(angle - spread),
      endY - head * Math.sin(angle - spread),
      endX - head * Math.cos(angle + spread),
      endY - head * Math.sin(angle + spread),
    );
  }

  private drawShotLines(selectedId: string | null): void {
    for (const clip of this.timeline.clips) {
      if (clip.kind !== 'attack') {
        continue;
      }

      const selected = clip.unitId === selectedId;
      const from = this.mapView.center(clip.attackerPos);
      const to = this.mapView.center(clip.targetPos);

      this.drawDashedLine(
        from,
        to,
        selected ? 2.5 : 1.5,
        selected ? 0.85 : 0.5,
        ATTACK_HINT_COLOR,
      );
    }
  }

  private drawDashedLine(
    from: { x: number; y: number },
    to: { x: number; y: number },
    width: number,
    alpha: number,
    color: number,
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      return;
    }

    const ux = dx / length;
    const uy = dy / length;
    const step = SHOT_LINE_DASH + SHOT_LINE_GAP;

    this.pathHints.lineStyle(width, color, alpha);

    for (let offset = 0; offset < length; offset += step) {
      const end = Math.min(offset + SHOT_LINE_DASH, length);
      this.pathHints.lineBetween(
        from.x + ux * offset,
        from.y + uy * offset,
        from.x + ux * end,
        from.y + uy * end,
      );
    }
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

    this.pendingGhost?.setVisible(false);
  }

  private drawCursor(): void {
    this.cursor.clear();

    if (!this.hover) {
      return;
    }

    outlineHex(this.cursor, this.mapView.center(this.hover), 0xffffff, 2);
  }

  private pointerOverModal(): boolean {
    return (
      this.pauseMenu?.isOpen === true ||
      (this.turnLogPanel?.isOpen ?? false) ||
      (this.recruitDialog?.isOpen ?? false) ||
      (this.tutorialConfirm?.isOpen ?? false) ||
      (this.objectivesPanel?.isOpen ?? false)
    );
  }

  private pointerOverCommandBar(pointer: Phaser.Input.Pointer): boolean {
    return !this.replayMode && pointer.y >= this.scale.height - BAR_HEIGHT;
  }

  private pointerOverPlanner(pointer: Phaser.Input.Pointer): boolean {
    return (
      !this.replayMode &&
      !this.pointerOverCommandBar(pointer) &&
      pointer.y >= this.scale.height - BAR_HEIGHT - (this.planner?.height ?? 0)
    );
  }

  private pointerOverUi(pointer: Phaser.Input.Pointer): boolean {
    return (
      this.pointerOverModal() ||
      this.pointerOverCommandBar(pointer) ||
      this.pointerOverPlanner(pointer)
    );
  }

  private refreshHud(): void {
    this.commandBar.refreshScenario({
      scenario: this.scenario,
      state: this.state,
      turn: this.turn,
      hover: this.hover,
      funds: this.recruitment.funds,
      recruitKind: this.recruitKind,
      vision: this.visionFor(this.turn.faction),
      recruitment: this.recruitment,
    });
  }

  private refreshTutorial(): void {
    const enemiesLeft = this.state.units.some(
      (unit) => unit.faction !== this.playerFaction,
    );

    if (this.tutorialSpawnedUnits.size > 0 && !enemiesLeft) {
      this.tutorialSurvived = Math.max(this.tutorialSurvived, 1);
    }

    const bazookaSpawnIndex =
      this.tutorialScript?.steps.findIndex((step) =>
        step.spawn?.some((unit) => unit.kind === 'bazooka'),
      ) ?? -1;

    if (bazookaSpawnIndex >= 0 && this.tutorialSpawnedUnits.has(bazookaSpawnIndex) && !enemiesLeft) {
      this.tutorialBazookaHits = Math.max(this.tutorialBazookaHits, 1);
    }

    const progress = this.tutorialProgressNow();

    const rewarded = applyTutorialRewards(
      this.recruitment,
      this.tutorialScript,
      progress,
      this.tutorialRewards,
    );

    if (rewarded.applied.length !== this.tutorialRewards.size) {
      this.tutorialRewards = new Set(rewarded.applied);
      this.recruitment = rewarded.recruitment;
      this.syncRecruitKind();
      this.refreshHud();
      this.refreshUnitPreview();
      this.planner.notice('Nagroda samouczka przyznana');
    }

    const needsBazookaConfirm =
      !this.replayMode &&
      this.scenario.id === 'tutorial-ruch-jednostek' &&
      progress.bazookaHits > 0 &&
      !this.tutorialConfirmed;

    if (needsBazookaConfirm && !this.tutorialConfirm.isOpen) {
      this.tutorialTip.hide();
      this.tutorialConfirm.show({
        title: 'TRAFIENIE Z BAZOOKI!',
        text: 'Karabiny nie przebiły pancerza, ale żołnierz z bazooką przy bazie trafił czołg i zadał mu 15 obrażeń. Pancerz nie chroni przed wszystkim — czołgowi zagrażają też inne czołgi, śmigłowce i artyleria. Kliknij ROZUMIEM, żeby zakończyć lekcję.',
      });
      return;
    }

    if (this.tutorialConfirm.isOpen) {
      return;
    }

    const hint = activeTutorialHint(this.tutorialScript, progress);

    if (hint) {
      this.tutorialTip.show(hint);
    } else {
      this.tutorialTip.hide();
    }

    if (
      !this.replayMode &&
      !this.finished &&
      this.scenario.sandbox &&
      tutorialComplete(this.tutorialScript, progress)
    ) {
      this.finishMission();
    }
  }

  private confirmTutorialBazooka(): void {
    if (!this.tutorialConfirm.isOpen) {
      return;
    }

    this.tutorialConfirmed = true;
    this.tutorialConfirm.hide();
    this.finishMission();
  }

  private tutorialProgressNow(): TutorialProgress {
    return {
      purchased: this.recruitment.purchased,
      moves: this.tutorialMoves,
      attacks: this.tutorialAttacks,
      boarded: this.tutorialBoarded,
      tankCol: this.tutorialTankCol,
      survived: this.tutorialSurvived,
      returned: this.tutorialReturned,
      bazookaHits: this.tutorialBazookaHits,
    };
  }

  private applyTutorialRetirements(): void {
    const indices = pendingTutorialRetirements(
      this.tutorialScript,
      this.tutorialProgressNow(),
      this.tutorialRetirements,
    );

    if (indices.length === 0) {
      return;
    }

    const retiredIds = new Set<string>();

    for (const index of indices) {
      const spawnIndex = this.tutorialScript?.steps[index]?.retireSpawn;

      if (spawnIndex === undefined) {
        continue;
      }

      for (const id of this.tutorialSpawnedUnits.get(spawnIndex) ?? []) {
        retiredIds.add(id);
      }

      this.tutorialRetirements.add(index);
    }

    if (retiredIds.size === 0) {
      return;
    }

    this.state = {
      ...this.state,
      units: this.state.units.filter((unit) => !retiredIds.has(unit.id)),
    };
  }

  private applyTutorialSpawns(): void {
    const batches = pendingTutorialSpawns(
      this.tutorialScript,
      this.tutorialProgressNow(),
      new Set(this.tutorialSpawnedUnits.keys()),
    );

    if (batches.length === 0) {
      return;
    }

    let state = this.state;
    const spawnedKinds = new Set<UnitKind>();

    for (const batch of batches) {
      const ids: string[] = [];

      for (const spawn of batch.units) {
        const beforeIds = new Set(state.units.map((unit) => unit.id));
        const coord = this.spawnCoord(state, spawn.faction, spawn.col, spawn.row);
        state = placeUnit(state, spawn.kind, coord, spawn.faction);
        const added = state.units.find((unit) => !beforeIds.has(unit.id));

        if (added) {
          ids.push(added.id);
        }

        spawnedKinds.add(spawn.kind);
      }

      this.tutorialSpawnedUnits.set(batch.index, ids);
    }

    this.state = state;

    if (!this.replayMode) {
      this.planner.notice(
        spawnedKinds.has('bazooka')
          ? 'Przy bazie pojawia się czerwony żołnierz z bazooką'
          : 'Na prawym skrzydle pojawiają się czerwoni karabinierzy',
      );
    }
  }

  private spawnCoord(
    state: GameState,
    faction: FactionId,
    col: number,
    row: number,
  ): HexCoord {
    const occupied = state.units.some((unit) => unit.pos.col === col && unit.pos.row === row);

    if (!occupied && getMoveCost(state, { col, row }) < IMPASSABLE) {
      return { col, row };
    }

    return findRecruitSlot(state, faction, { col, row }) ?? { col, row };
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
    case 'not-carrier':
      return 'Ten pojazd nie może zabrać pasażera';
    case 'cargo-full':
      return 'Pojazd jest już pełny';
    case 'not-carried':
      return 'Ten rodzaj jednostki nie wsiada do pojazdu';
    default:
      return 'Nie można zaplanować tej akcji';
  }
}
