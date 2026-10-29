import Phaser from 'phaser';
import {
  clearMap,
  extendMap,
  generateMap,
  mapMemoryUsage,
  measureMapOperation,
  removeTerrain,
  setTerrain,
  terrainAt,
  type HexCoord,
  type MapDefinition,
  type MapEdge,
} from '../core/map';
import {
  createInitialState,
  placeUnit,
  removeUnitAt,
  type GameState,
} from '../core/state';
import type { TerrainId } from '../core/terrain';
import type { FactionId, UnitKind } from '../core/units';
import { devToolsEnabled } from '../devTools';
import { createSavedMapId, saveMap } from '../storage/maps';
import { DevBar } from '../view/devBar';
import { buildEditorHud } from '../view/editorHud';
import {
  EDITOR_FACTION_BUTTON_HEIGHT,
  EDITOR_FACTION_TOP,
  EDITOR_HUD_Y,
  EDITOR_PANEL_WIDTH,
  EDITOR_PANEL_X,
  EDITOR_PANEL_Y,
  EDITOR_TERRAIN_LABEL_Y,
  EDITOR_UNIT_LABEL_Y,
  EditorMenu,
  type EditorMenuState,
  type EditorTool,
} from '../view/editorMenu';
import { HexMapView, outlineHex } from '../view/hexGrid';
import { MapNameField } from '../view/mapNameField';
import { MapViewport } from '../view/mapViewport';
import { UnitLayer } from '../view/unitLayer';

const TITLE_Y = EDITOR_PANEL_Y + 10;
const BUTTONS_Y = 26;
const EDGE_GROWTH_INTERVAL = 120;

const EDGE_BY_KEY: Record<string, MapEdge> = {
  w: 'top',
  arrowup: 'top',
  s: 'bottom',
  arrowdown: 'bottom',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
};

type EditorTarget = 'menu' | 'map-menu' | 'scenario-menu';

interface EditorData {
  readonly definition?: MapDefinition;
  readonly state?: GameState;
  readonly returnTo?: EditorTarget;
}

export class MapEditorScene extends Phaser.Scene {
  private state: GameState = createInitialState(generateMap());
  private mapId: string | null = null;
  private mapName = 'nowa';
  private returnTo: EditorTarget = 'map-menu';
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private readonly devTools = devToolsEnabled();

  private tool: EditorTool = 'terrain';
  private brush: TerrainId = 'plain';
  private unitKind: UnitKind = 'infantry';
  private faction: FactionId = 'blue';
  private hover: HexCoord | null = null;
  private paintButton: number | null = null;
  private painted: { coord: HexCoord; button: number } | null = null;
  private shiftDown = false;
  private edgeGrowthMs = 0;
  private mapCpuMs = 0;
  private lastOperationMs = 0;
  private mapBytes = 0;
  private saving = false;

  private viewport!: MapViewport;
  private mapView!: HexMapView;
  private unitView!: UnitLayer;
  private hud!: Phaser.GameObjects.Text;
  private nameField!: MapNameField;
  private menu!: EditorMenu;
  private devBar?: DevBar;
  private panel!: Phaser.GameObjects.Rectangle;
  private cursor!: Phaser.GameObjects.Graphics;
  private saveButton!: Phaser.GameObjects.Text;
  private mapButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('map-editor');
  }

  init(data: EditorData): void {
    const definition = data?.definition;

    this.mapId = definition?.id ?? null;
    this.mapName = definition?.name ?? 'nowa';
    this.returnTo = data?.returnTo ?? 'map-menu';
    this.state = this.measure(
      () => data?.state ?? createInitialState(definition?.map ?? generateMap()),
    );
  }

  create(): void {
    this.viewport = new MapViewport(this, this.state.map, {
      zoomMin: 0.75,
      zoomMax: 2.5,
      edgePanBlocked: (pointer) => this.pointerOverPanel(pointer),
    });

    const renderStarted = performance.now();
    this.mapView = new HexMapView(this, this.state.map);
    this.unitView = new UnitLayer(this, this.state.units);
    this.mapCpuMs += performance.now() - renderStarted;
    this.mapBytes = mapMemoryUsage(this.state.map);

    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.panel = this.add.rectangle(
      EDITOR_PANEL_X,
      EDITOR_PANEL_Y,
      EDITOR_PANEL_WIDTH,
      160,
      0x0b0f14,
      0.85,
    );
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(1, 0x3d6b4f, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(10);

    this.add
      .text(EDITOR_PANEL_X + 12, TITLE_Y, 'EDYTOR MAP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.nameField = new MapNameField(
      this,
      this.mapName,
      (name) => {
        this.mapName = name;
      },
      () => this.startNameEdit(),
    );

    this.add
      .text(EDITOR_PANEL_X + 12, EDITOR_TERRAIN_LABEL_Y, 'TEREN', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.menu = new EditorMenu(this, this.menuState(), {
      onTerrain: (terrain) => {
        this.tool = 'terrain';
        this.brush = terrain;
        this.refreshHud();
      },
      onUnit: (kind) => {
        this.tool = 'unit';
        this.unitKind = kind;
        this.refreshHud();
      },
      onFaction: (faction) => {
        this.faction = faction;
        this.refreshHud();
      },
    });

    this.add
      .text(EDITOR_PANEL_X + 12, EDITOR_UNIT_LABEL_Y, 'JEDNOSTKI', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.add
      .text(
        EDITOR_PANEL_X + 12,
        EDITOR_FACTION_TOP + EDITOR_FACTION_BUTTON_HEIGHT / 2,
        'STRONA',
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.hud = this.add.text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d8e2dc',
    });
    this.hud.setScrollFactor(0);
    this.hud.setDepth(11);

    if (this.devTools) {
      this.devBar = new DevBar(this, EDITOR_PANEL_X + 12, EDITOR_HUD_Y, 'left');
    }

    this.mapButton = this.add
      .text(EDITOR_PANEL_X + 90, EDITOR_HUD_Y, 'MENU MAP', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.mapButton.on('pointerover', () => this.mapButton.setColor('#a6f4c5'));
    this.mapButton.on('pointerout', () => this.mapButton.setColor('#ffffff'));
    this.mapButton.on('pointerdown', () => this.leaveTo('map-menu'));

    this.menuButton = this.add
      .text(EDITOR_PANEL_X + 160, EDITOR_HUD_Y, 'MENU GŁÓWNE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.menuButton.on('pointerover', () => this.menuButton.setColor('#a6f4c5'));
    this.menuButton.on('pointerout', () => this.menuButton.setColor('#ffffff'));
    this.menuButton.on('pointerdown', () => this.leaveTo('menu'));

    this.add
      .text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y + 16, 'UTWÓRZ SCENARIUSZ', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', (object: Phaser.GameObjects.Text) => object.setColor('#a6f4c5'))
      .on('pointerout', (object: Phaser.GameObjects.Text) => object.setColor('#9fb0a5'))
      .on('pointerdown', () => this.createScenarioFromEditor());

    this.saveButton = this.add
      .text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y, 'ZAPISZ', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a6f4c5',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.saveButton.on('pointerover', () => this.saveButton.setColor('#ffffff'));
    this.saveButton.on('pointerout', () => this.saveButton.setColor('#a6f4c5'));
    this.saveButton.on('pointerdown', () => void this.saveCurrentMap());

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
      keyboard.on('keyup', this.onKeyUp, this);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.resetEditor, this);

    this.refreshHud();
  }

  private menuState(): EditorMenuState {
    return {
      tool: this.tool,
      brush: this.brush,
      unitKind: this.unitKind,
      faction: this.faction,
    };
  }

  private startNameEdit(): void {
    if (this.nameField.isEditing) {
      return;
    }

    this.shiftDown = false;
    this.keys.forEach((key) => key.reset());
    this.nameField.start();
  }

  private resetEditor(): void {
    this.state = createInitialState(generateMap());
    this.mapId = null;
    this.mapName = 'nowa';
    this.tool = 'terrain';
    this.brush = 'plain';
    this.unitKind = 'infantry';
    this.faction = 'blue';
    this.hover = null;
    this.paintButton = null;
    this.painted = null;
    this.shiftDown = false;
    this.mapCpuMs = 0;
    this.lastOperationMs = 0;
    this.mapBytes = 0;
    this.saving = false;
  }

  update(_time: number, delta: number): void {
    this.refreshDevBar(delta);

    if (this.nameField?.isEditing) {
      return;
    }

    if (this.shiftDown) {
      this.growEdge(delta);
      return;
    }

    this.viewport.update(delta, {
      left: (this.cursors?.left.isDown ?? false) || this.isDown('A'),
      right: (this.cursors?.right.isDown ?? false) || this.isDown('D'),
      up: (this.cursors?.up.isDown ?? false) || this.isDown('W'),
      down: (this.cursors?.down.isDown ?? false) || this.isDown('S'),
    });
  }

  private growEdge(delta: number): void {
    const edge = this.heldEdge();

    if (!edge) {
      this.edgeGrowthMs = 0;
      return;
    }

    this.edgeGrowthMs += delta;

    if (this.edgeGrowthMs < EDGE_GROWTH_INTERVAL) {
      return;
    }

    this.edgeGrowthMs = 0;
    this.extendEdge(edge);
  }

  private heldEdge(): MapEdge | undefined {
    if (this.cursors?.up.isDown || this.isDown('W')) return 'top';
    if (this.cursors?.down.isDown || this.isDown('S')) return 'bottom';
    if (this.cursors?.left.isDown || this.isDown('A')) return 'left';
    if (this.cursors?.right.isDown || this.isDown('D')) return 'right';

    return undefined;
  }

  private isDown(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.startPan(pointer)) {
      return;
    }

    if (this.pointerOverPanel(pointer)) {
      return;
    }

    if (this.nameField.isEditing) {
      this.nameField.commit();
    }

    if (pointer.button !== 0 && pointer.button !== 2) {
      return;
    }

    this.paintButton = pointer.button;
    this.paintAt(this.hexUnderPointer(pointer), pointer.button);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.movePan(pointer)) {
      return;
    }

    if (this.pointerOverPanel(pointer)) {
      this.paintButton = null;
      this.painted = null;

      if (this.hover) {
        this.hover = null;
        this.cursor.clear();
        this.refreshHud();
      }

      return;
    }

    const coord = this.hexUnderPointer(pointer);

    if (this.paintButton !== null && pointer.isDown) {
      this.paintAt(coord, this.paintButton);
    }

    if (coord.col === this.hover?.col && coord.row === this.hover?.row) {
      return;
    }

    this.hover = coord;

    this.cursor.clear();
    outlineHex(this.cursor, this.mapView.center(coord), 0xffffff, 2);

    this.refreshHud();
  }

  private onPointerUp(): void {
    this.viewport.endPan();
    this.paintButton = null;
    this.painted = null;
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
    if (this.nameField.isEditing) {
      this.nameField.handleKey(event);
      return;
    }

    if (event.key === 'Shift') {
      this.shiftDown = true;
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'escape') {
      this.leaveTo(event.shiftKey ? 'menu' : this.returnTo);
      return;
    }

    if (key === 'x') {
      this.state = this.measure(() => createInitialState(clearMap()));
      this.syncView();
      return;
    }

    if (event.shiftKey) {
      const edge = EDGE_BY_KEY[key];

      if (edge) {
        this.extendEdge(edge);
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.shiftDown = false;
    }
  }

  private extendEdge(edge: MapEdge): void {
    this.state = this.measure(() => ({
      ...this.state,
      map: extendMap(this.state.map, edge, 1, this.brush),
    }));
    this.syncView();
  }

  private measure<T>(operation: () => T): T {
    const measured = measureMapOperation(operation);

    this.mapCpuMs += measured.ms;
    this.lastOperationMs = measured.ms;

    return measured.result;
  }

  private leaveTo(target: EditorTarget): void {
    if (this.nameField.isEditing) {
      this.nameField.commit();
    }

    if (this.mapId) {
      this.registry.set(`map:draft:${this.mapId}`, this.state);
    }

    this.scene.start(target);
  }

  private async saveCurrentMap(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.nameField.isEditing) {
      this.nameField.commit();
    }

    this.saving = true;

    const id = this.mapId ?? createSavedMapId();
    const name = this.mapName === 'nowa' ? 'Mapa lokalna' : this.mapName;

    try {
      await saveMap({
        id,
        name,
        description: 'Mapa zapisana w edytorze',
        state: this.state,
      });

      this.mapId = id;
      this.mapName = name;
      this.nameField.setValue(name);
      this.saveButton.setText('ZAPISANO');
      this.refreshHud();

      this.time.delayedCall(1400, () => this.saveButton.setText('ZAPISZ'));
    } catch (error) {
      console.error('Nie udało się zapisać mapy w SQLite', error);
      this.saveButton.setText('BŁĄD ZAPISU');

      this.time.delayedCall(1800, () => this.saveButton.setText('ZAPISZ'));
    } finally {
      this.saving = false;
    }
  }

  private pointerOverPanel(pointer: Phaser.Input.Pointer): boolean {
    if (!this.panel) {
      return false;
    }

    return (
      pointer.x >= EDITOR_PANEL_X &&
      pointer.x <= EDITOR_PANEL_X + this.panel.width &&
      pointer.y >= EDITOR_PANEL_Y &&
      pointer.y <= EDITOR_PANEL_Y + this.panel.height
    );
  }

  private hexUnderPointer(pointer: Phaser.Input.Pointer): HexCoord {
    return this.viewport.hexAt(pointer);
  }

  private paintAt(coord: HexCoord, button: number): void {
    if (
      this.painted?.coord.col === coord.col &&
      this.painted.coord.row === coord.row &&
      this.painted.button === button
    ) {
      return;
    }

    this.painted = { coord, button };

    if (this.tool === 'unit') {
      if (!terrainAt(this.state.map, coord)) {
        return;
      }

      this.state = this.measure(() =>
        button === 2
          ? removeUnitAt(this.state, coord)
          : placeUnit(this.state, this.unitKind, coord, this.faction),
      );
      this.syncView();
      return;
    }

    const map = this.measure(() =>
      button === 2
        ? removeTerrain(this.state.map, coord)
        : setTerrain(this.state.map, coord, this.brush),
    );

    this.state =
      button === 2
        ? removeUnitAt({ ...this.state, map }, coord)
        : { ...this.state, map };

    this.syncView();
  }

  private syncView(): void {
    const started = performance.now();
    this.mapView.setMap(this.state.map);
    this.unitView.setUnits(this.state.units);
    this.mapCpuMs += performance.now() - started;
    this.mapBytes = mapMemoryUsage(this.state.map);

    this.viewport.setMap(this.state.map);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.hud.setText(
      buildEditorHud({
        mapName: this.mapName,
        tool: this.tool,
        brush: this.brush,
        unitKind: this.unitKind,
        hover: this.hover,
        state: this.state,
      }),
    );
    this.nameField.refresh();
    this.drawButtons();
    this.panel.setSize(
      Math.max(EDITOR_PANEL_WIDTH, this.hud.width + 24),
      this.panelContentBottom() - EDITOR_PANEL_Y,
    );
    this.menu.refresh(this.menuState());
  }

  private drawButtons(): void {
    const y = EDITOR_HUD_Y + this.hud.height + 4;

    this.saveButton.setY(y);
    this.mapButton.setY(y);
    this.menuButton.setY(y);

    if (this.devBar) {
      this.devBar.setPosition(EDITOR_PANEL_X + 12, y + 22);
    }
  }

  private panelContentBottom(): number {
    const buttonsBottom = EDITOR_HUD_Y + this.hud.height + BUTTONS_Y;

    if (!this.devBar) {
      return buttonsBottom;
    }

    return Math.max(buttonsBottom, this.devBar.y + this.devBar.height + 12);
  }

  private refreshDevBar(delta: number): void {
    this.devBar?.update(delta, {
      tiles: this.mapView.tileCount,
      cpuMs: this.mapCpuMs,
      lastOperationMs: this.lastOperationMs,
      mapBytes: this.mapBytes,
    });

    this.panel.setSize(
      Math.max(EDITOR_PANEL_WIDTH, this.hud.width + 24),
      this.panelContentBottom() - EDITOR_PANEL_Y,
    );
  }

  private async createScenarioFromEditor(): Promise<void> {
    await this.saveCurrentMap();
    this.scene.start('scenario-menu');
  }
}
