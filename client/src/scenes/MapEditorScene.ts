import Phaser from 'phaser';
import {
  clearMap,
  extendMap,
  generateMap,
  hexCorners,
  mapDoubledBounds,
  mapMemoryUsage,
  mapPixelBounds,
  measureMapOperation,
  pixelToHex,
  removeTerrain,
  setTerrain,
  terrainAt,
  toDoubled,
  type HexCoord,
  type MapDefinition,
  type MapEdge,
} from '../core/map';
import {
  createInitialState,
  findUnitAt,
  placeUnit,
  removeUnitAt,
  type GameState,
} from '../core/state';
import { TERRAIN_DEFS, TERRAIN_IDS, type TerrainId } from '../core/terrain';
import { FACTION_DEFS, UNIT_DEFS, UNIT_KINDS, type FactionId, type UnitKind } from '../core/units';
import { devToolsEnabled } from '../devTools';
import { createSavedMapId, saveMap } from '../storage/maps';
import { DevBar } from '../view/devBar';
import { createHexSprite, HEX_SIZE, HexMapView, tracePolygon } from '../view/hexGrid';
import {
  createUnitToken,
  UnitLayer,
  unitTexture,
  unitTextureKey,
} from '../view/unitLayer';

const SWATCH_RADIUS = 9;
const PANEL_X = 0;
const PANEL_Y = 8;
const PANEL_WIDTH = 250;
const TILE_WIDTH = 56;
const TILE_HEIGHT = 46;
const TILE_GAP = 2;
const TILE_COLUMNS = 4;
const MENU_PADDING = 8;
const TITLE_Y = PANEL_Y + 10;
const TERRAIN_LABEL_Y = PANEL_Y + 34;
const TERRAIN_TOP = PANEL_Y + 48;
const TERRAIN_ROWS = Math.ceil(TERRAIN_IDS.length / TILE_COLUMNS);
const UNIT_LABEL_Y = TERRAIN_TOP + TERRAIN_ROWS * TILE_HEIGHT + 8;
const UNIT_TOP = UNIT_LABEL_Y + 14;
const UNIT_BOTTOM = UNIT_TOP + TILE_HEIGHT;
const FACTION_TOP = UNIT_BOTTOM + 8;
const FACTION_BUTTON_WIDTH = 80;
const FACTION_BUTTON_HEIGHT = 22;
const FACTION_BUTTON_GAP = 4;
const FACTION_BUTTONS_X = PANEL_X + 56;
const HUD_Y = FACTION_TOP + 30;
const BUTTONS_Y = 26;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;
const PAN_SPEED = 420;
const EDGE_GROWTH_INTERVAL = 120;
const CAMERA_MARGIN = HEX_SIZE * 8;
const BASE_BOUNDS = mapPixelBounds(generateMap(), HEX_SIZE);

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

type EditorTool = 'terrain' | 'unit';

interface EditorData {
  readonly definition?: MapDefinition;
  readonly state?: GameState;
}

interface TerrainTile {
  readonly terrain: TerrainId;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly swatch: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

interface UnitTile {
  readonly kind: UnitKind;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly token: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

interface FactionButton {
  readonly faction: FactionId;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class MapEditorScene extends Phaser.Scene {
  private state: GameState = createInitialState(generateMap());
  private mapId: string | null = null;
  private mapName = 'nowa';
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private readonly devTools = devToolsEnabled();

  private tool: EditorTool = 'terrain';
  private brush: TerrainId = 'plain';
  private unitKind: UnitKind = 'infantry';
  private faction: FactionId = 'blue';
  private hover: HexCoord | null = null;
  private panning = false;
  private panAnchor = { x: 0, y: 0, scrollX: 0, scrollY: 0 };
  private paintButton: number | null = null;
  private painted: { coord: HexCoord; button: number } | null = null;
  private shiftDown = false;
  private edgeGrowthMs = 0;
  private mapCpuMs = 0;
  private lastOperationMs = 0;
  private mapBytes = 0;
  private saving = false;

  private mapView!: HexMapView;
  private unitView!: UnitLayer;
  private hud!: Phaser.GameObjects.Text;
  private devBar?: DevBar;
  private panel!: Phaser.GameObjects.Rectangle;
  private cursor!: Phaser.GameObjects.Graphics;
  private saveButton!: Phaser.GameObjects.Text;
  private mapButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;
  private terrainTiles: TerrainTile[] = [];
  private unitTiles: UnitTile[] = [];
  private factionButtons: FactionButton[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('map-editor');
  }

  init(data: EditorData): void {
    const definition = data?.definition;

    this.mapId = definition?.id ?? null;
    this.mapName = definition?.name ?? 'nowa';
    this.state = this.measure(
      () => data?.state ?? createInitialState(definition?.map ?? generateMap()),
    );
  }

  create(): void {
    const camera = this.cameras.main;
    camera.setZoom(1);

    const renderStarted = performance.now();
    this.mapView = new HexMapView(this, this.state.map);
    this.unitView = new UnitLayer(this, this.state.units);
    this.mapCpuMs += performance.now() - renderStarted;
    this.mapBytes = mapMemoryUsage(this.state.map);

    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.panel = this.add.rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, 160, 0x0b0f14, 0.85);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(1, 0x3d6b4f, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(10);

    this.add
      .text(PANEL_X + 12, TITLE_Y, 'EDYTOR MAP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.add
      .text(PANEL_X + 12, TERRAIN_LABEL_Y, 'TEREN', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.terrainTiles = TERRAIN_IDS.map((terrain, index) =>
      this.createTerrainTile(terrain, index),
    );

    this.add
      .text(PANEL_X + 12, UNIT_LABEL_Y, 'JEDNOSTKI', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.unitTiles = UNIT_KINDS.map((kind, index) => this.createUnitTile(kind, index));

    this.add
      .text(PANEL_X + 12, FACTION_TOP + FACTION_BUTTON_HEIGHT / 2, 'STRONA', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    const factions: FactionId[] = ['blue', 'red'];
    this.factionButtons = factions.map((faction, index) =>
      this.createFactionButton(faction, index),
    );

    this.hud = this.add.text(PANEL_X + 12, HUD_Y, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d8e2dc',
    });
    this.hud.setScrollFactor(0);
    this.hud.setDepth(11);

    if (this.devTools) {
      this.devBar = new DevBar(this, PANEL_X + 12, HUD_Y, 'left');
    }

    this.mapButton = this.add
      .text(PANEL_X + 90, HUD_Y, 'MENU MAP', {
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
      .text(PANEL_X + 160, HUD_Y, 'MENU GŁÓWNE', {
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

    this.saveButton = this.add
      .text(PANEL_X + 12, HUD_Y, 'ZAPISZ', {
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

    this.updateCameraBounds();
    this.refreshHud();
  }

  private createTerrainTile(terrain: TerrainId, index: number): TerrainTile {
    const column = index % TILE_COLUMNS;
    const row = Math.floor(index / TILE_COLUMNS);
    const centerX = this.tileX(column);
    const centerY = this.tileY(TERRAIN_TOP, row);
    const top = centerY - TILE_HEIGHT / 2;
    const background = this.createTileBackground(centerX, centerY);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.tool = 'terrain';
      this.brush = terrain;
      this.refreshHud();
    });

    const swatch = createHexSprite(this, terrain, SWATCH_RADIUS);
    swatch.setPosition(centerX, top + 15);
    swatch.setScrollFactor(0);
    swatch.setDepth(11);

    const label = this.add
      .text(centerX, top + 36, TERRAIN_DEFS[terrain].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { terrain, background, swatch, label };
  }

  private createUnitTile(kind: UnitKind, index: number): UnitTile {
    const column = index % TILE_COLUMNS;
    const row = Math.floor(index / TILE_COLUMNS);
    const centerX = this.tileX(column);
    const centerY = this.tileY(UNIT_TOP, row);
    const top = centerY - TILE_HEIGHT / 2;
    const background = this.createTileBackground(centerX, centerY);

    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.tool = 'unit';
      this.unitKind = kind;
      this.refreshHud();
    });

    const token = createUnitToken(this, kind, this.faction);
    token.setPosition(centerX, top + 15);
    token.setScrollFactor(0);
    token.setDepth(11);

    const label = this.add
      .text(centerX, top + 36, UNIT_DEFS[kind].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { kind, background, token, label };
  }

  private createFactionButton(faction: FactionId, index: number): FactionButton {
    const centerX =
      FACTION_BUTTONS_X +
      FACTION_BUTTON_WIDTH / 2 +
      index * (FACTION_BUTTON_WIDTH + FACTION_BUTTON_GAP);
    const centerY = FACTION_TOP + FACTION_BUTTON_HEIGHT / 2;
    const background = this.add.rectangle(
      centerX,
      centerY,
      FACTION_BUTTON_WIDTH,
      FACTION_BUTTON_HEIGHT,
      0x142018,
      0.9,
    );

    background.setStrokeStyle(1, 0x2a3f33, 1);
    background.setScrollFactor(0);
    background.setDepth(10.5);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => this.highlightTile(background));
    background.on('pointerout', () => this.refreshMenu());
    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.faction = faction;
      this.refreshHud();
    });

    const label = this.add
      .text(centerX, centerY, FACTION_DEFS[faction].label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    return { faction, background, label };
  }

  private createTileBackground(
    centerX: number,
    centerY: number,
  ): Phaser.GameObjects.Rectangle {
    const background = this.add.rectangle(
      centerX,
      centerY,
      TILE_WIDTH,
      TILE_HEIGHT,
      0x142018,
      0.9,
    );

    background.setStrokeStyle(1, 0x2a3f33, 1);
    background.setScrollFactor(0);
    background.setDepth(10.5);
    background.setInteractive({ useHandCursor: true });
    background.on('pointerover', () => this.highlightTile(background));
    background.on('pointerout', () => this.refreshMenu());

    return background;
  }

  private tileX(column: number): number {
    return (
      PANEL_X + MENU_PADDING + column * (TILE_WIDTH + TILE_GAP) + TILE_WIDTH / 2
    );
  }

  private tileY(top: number, row: number): number {
    return top + row * TILE_HEIGHT + TILE_HEIGHT / 2;
  }

  private highlightTile(background: Phaser.GameObjects.Rectangle): void {
    if (background.getData('selected') === true) {
      return;
    }

    background.setFillStyle(0x1d2f24, 1);
    background.setStrokeStyle(1, 0x6fbf8f, 1);
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
    this.panning = false;
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

    if (this.shiftDown) {
      this.growEdge(delta);
      return;
    }

    const camera = this.cameras.main;
    const step = (PAN_SPEED * delta) / 1000;

    let dx = 0;
    let dy = 0;

    if (this.cursors?.left.isDown || this.isDown('A')) dx -= 1;
    if (this.cursors?.right.isDown || this.isDown('D')) dx += 1;
    if (this.cursors?.up.isDown || this.isDown('W')) dy -= 1;
    if (this.cursors?.down.isDown || this.isDown('S')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      camera.scrollX += dx * step;
      camera.scrollY += dy * step;
    }
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
    if (pointer.button === 1) {
      this.panning = true;
      this.panAnchor = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
      };
      return;
    }

    if (this.pointerOverPanel(pointer)) {
      return;
    }

    if (pointer.button !== 0 && pointer.button !== 2) {
      return;
    }

    this.paintButton = pointer.button;
    this.paintAt(this.hexUnderPointer(pointer), pointer.button);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.panning) {
      const camera = this.cameras.main;
      camera.scrollX = this.panAnchor.scrollX - (pointer.x - this.panAnchor.x);
      camera.scrollY = this.panAnchor.scrollY - (pointer.y - this.panAnchor.y);
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
    tracePolygon(this.cursor, hexCorners(this.mapView.center(coord), HEX_SIZE));
    this.cursor.lineStyle(2, 0xffffff, 0.9);
    this.cursor.strokePath();

    this.refreshHud();
  }

  private onPointerUp(): void {
    this.panning = false;
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

    const camera = this.cameras.main;
    const zoom = camera.zoom + (deltaY > 0 ? -0.15 : 0.15);
    camera.setZoom(Phaser.Math.Clamp(zoom, ZOOM_MIN, ZOOM_MAX));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.shiftDown = true;
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'escape') {
      this.leaveTo(event.shiftKey ? 'menu' : 'map-menu');
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

  private leaveTo(target: 'menu' | 'map-menu'): void {
    if (this.mapId) {
      this.registry.set(`map:draft:${this.mapId}`, this.state);
    }

    this.scene.start(target);
  }

  private async saveCurrentMap(): Promise<void> {
    if (this.saving) {
      return;
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
    return (
      pointer.x >= PANEL_X &&
      pointer.x <= PANEL_X + this.panel.width &&
      pointer.y >= PANEL_Y &&
      pointer.y <= PANEL_Y + this.panel.height
    );
  }

  private hexUnderPointer(pointer: Phaser.Input.Pointer): HexCoord {
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    return pixelToHex(world.x, world.y, HEX_SIZE);
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

    this.updateCameraBounds();
    this.refreshHud();
  }

  private updateCameraBounds(): void {
    const camera = this.cameras.main;
    const bounds = mapPixelBounds(this.state.map, HEX_SIZE) ?? BASE_BOUNDS;

    if (!bounds) {
      return;
    }

    camera.setBounds(
      bounds.left - CAMERA_MARGIN,
      bounds.top - CAMERA_MARGIN,
      bounds.right - bounds.left + CAMERA_MARGIN * 2,
      bounds.bottom - bounds.top + CAMERA_MARGIN * 2,
    );
  }

  private refreshHud(): void {
    const lines: string[] = [];

    lines.push(`Mapa: ${this.mapName}`);
    lines.push(`Tryb: ${this.tool === 'unit' ? 'jednostki' : 'teren'}`);

    if (this.tool === 'unit') {
      lines.push(`Jednostka: ${UNIT_DEFS[this.unitKind].label}`);
    } else {
      lines.push(`Pędzel: ${TERRAIN_DEFS[this.brush].label}`);
    }

    if (this.hover) {
      const terrain = terrainAt(this.state.map, this.hover);
      const unit = findUnitAt(this.state, this.hover);
      const hex = toDoubled(this.hover);

      let label = terrain ? ` — ${TERRAIN_DEFS[terrain].label}` : ' — pusto';

      if (unit) {
        label += ` · ${UNIT_DEFS[unit.kind].label}`;
      }

      lines.push(`Heks: ${hex.col},${hex.row}${label}`);
    } else {
      lines.push('Heks: —');
    }

    const bounds = mapDoubledBounds(this.state.map);
    lines.push(
      `Kafelki: ${Object.keys(this.state.map.cells).length} · Jedn.: ${this.state.units.length}`,
    );

    if (bounds) {
      lines.push(`Zasięg: ${bounds.minCol}-${bounds.maxCol} × ${bounds.minRow}-${bounds.maxRow}`);
    } else {
      lines.push('Zasięg: —');
    }

    lines.push('');
    lines.push('LPM — maluj · PPM — usuń');
    lines.push('Klik — wybór w menu po lewej');
    lines.push('X — czyść mapę');
    lines.push('Shift+strzałki — wzrost mapy');
    lines.push('Kamera: strzałki/WASD');
    lines.push('Kółko — zoom');
    lines.push('ZAPISZ — mapa do SQLite');
    lines.push('ESC — mapy · Shift+ESC — menu');

    this.hud.setText(lines.join('\n'));
    this.drawButtons();
    this.panel.setSize(
      Math.max(PANEL_WIDTH, this.hud.width + 24),
      this.panelContentBottom() - PANEL_Y,
    );
    this.refreshMenu();
  }

  private drawButtons(): void {
    const y = HUD_Y + this.hud.height + 4;

    this.saveButton.setY(y);
    this.mapButton.setY(y);
    this.menuButton.setY(y);

    if (this.devBar) {
      this.devBar.setPosition(PANEL_X + 12, y + 22);
    }
  }

  private panelContentBottom(): number {
    const buttonsBottom = HUD_Y + this.hud.height + BUTTONS_Y;

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
      Math.max(PANEL_WIDTH, this.hud.width + 24),
      this.panelContentBottom() - PANEL_Y,
    );
  }

  private refreshMenu(): void {
    this.terrainTiles.forEach(({ terrain, background, swatch, label }) => {
      const selected = this.tool === 'terrain' && terrain === this.brush;

      this.styleTile(background, selected);
      swatch.setScale(selected ? 1.2 : 1);
      label.setColor(selected ? '#a6f4c5' : '#d8e2dc');
    });

    this.unitTiles.forEach(({ kind, background, token, label }) => {
      const selected = this.tool === 'unit' && kind === this.unitKind;

      this.styleTile(background, selected);
      unitTexture(this, kind, this.faction);
      token.setTexture(unitTextureKey(kind, this.faction));
      token.setScale(selected ? 1.1 : 1);
      label.setColor(selected ? '#a6f4c5' : '#d8e2dc');
    });

    this.factionButtons.forEach(({ faction, background, label }) => {
      const selected = this.faction === faction;

      background.setFillStyle(selected ? 0x1f3a2a : 0x142018, selected ? 1 : 0.9);
      background.setStrokeStyle(
        selected ? 2 : 1,
        selected ? FACTION_DEFS[faction].color : 0x2a3f33,
        1,
      );
      background.setData('selected', selected);
      label.setColor(selected ? '#ffffff' : '#9fb0a5');
    });
  }

  private styleTile(background: Phaser.GameObjects.Rectangle, selected: boolean): void {
    background.setFillStyle(selected ? 0x1f3a2a : 0x142018, selected ? 1 : 0.9);
    background.setStrokeStyle(selected ? 2 : 1, selected ? 0xa6f4c5 : 0x2a3f33, 1);
    background.setData('selected', selected);
  }
}
