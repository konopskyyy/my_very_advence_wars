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
  type GameMap,
  type HexCoord,
  type MapDefinition,
  type MapEdge,
} from '../core/map';
import { TERRAIN_DEFS, TERRAIN_IDS, type TerrainId } from '../core/terrain';
import { devToolsEnabled } from '../devTools';
import { DevBar } from '../view/devBar';
import { createHexSprite, HEX_SIZE, HexMapView, tracePolygon } from '../view/hexGrid';

const SWATCH_RADIUS = 9;
const SWATCH_GAP = 27;
const SWATCH_Y = 56;
const LABEL_Y = 72;
const HUD_Y = 92;
const PANEL_X = 8;
const PANEL_Y = 8;
const PANEL_WIDTH = 268;
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

interface EditorData {
  readonly definition?: MapDefinition;
}

export class MapEditorScene extends Phaser.Scene {
  private map: GameMap = generateMap();
  private mapId: string | null = null;
  private mapName = 'nowa';
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private readonly devTools = devToolsEnabled();

  private brush: TerrainId = 'plain';
  private hover: HexCoord | null = null;
  private panning = false;
  private panAnchor = { x: 0, y: 0, scrollX: 0, scrollY: 0 };
  private paintButton: number | null = null;
  private painted: { coord: HexCoord; button: number } | null = null;
  private shiftDown = false;
  private devOverlay = false;
  private edgeGrowthMs = 0;
  private mapCpuMs = 0;
  private lastOperationMs = 0;
  private mapBytes = 0;

  private mapView!: HexMapView;
  private hud!: Phaser.GameObjects.Text;
  private devBar?: DevBar;
  private panel!: Phaser.GameObjects.Rectangle;
  private cursor!: Phaser.GameObjects.Graphics;
  private mapButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;
  private swatches: Phaser.GameObjects.Image[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('map-editor');
  }

  init(data: EditorData): void {
    const definition = data?.definition;

    this.mapId = definition?.id ?? null;
    this.mapName = definition?.name ?? 'nowa';
    this.map = this.measure(() => definition?.map ?? generateMap());
  }

  create(): void {
    const camera = this.cameras.main;
    camera.setZoom(1);

    const renderStarted = performance.now();
    this.mapView = new HexMapView(this, this.map);
    this.mapCpuMs += performance.now() - renderStarted;
    this.mapBytes = mapMemoryUsage(this.map);

    this.cursor = this.add.graphics();
    this.cursor.setDepth(5);

    this.panel = this.add.rectangle(PANEL_X, PANEL_Y, PANEL_WIDTH, 160, 0x0b0f14, 0.85);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(1, 0x3d6b4f, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(10);

    this.add
      .text(PANEL_X + 12, PANEL_Y + 10, 'EDYTOR MAP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.swatches = TERRAIN_IDS.map((terrain, index) => {
      const swatch = createHexSprite(this, terrain, SWATCH_RADIUS);

      swatch.setPosition(PANEL_X + 20 + index * SWATCH_GAP, SWATCH_Y);
      swatch.setScrollFactor(0);
      swatch.setDepth(11);

      return swatch;
    });

    TERRAIN_IDS.forEach((_terrain, index) => {
      this.add
        .text(PANEL_X + 20 + index * SWATCH_GAP, LABEL_Y, String(index + 1), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(11);
    });

    this.hud = this.add.text(PANEL_X + 12, HUD_Y, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d8e2dc',
    });
    this.hud.setScrollFactor(0);
    this.hud.setDepth(11);

    if (this.devTools) {
      this.devBar = new DevBar(this, this.scale.width - 8, PANEL_Y);
      this.devBar.setVisible(this.devOverlay);
    }

    this.mapButton = this.add
      .text(PANEL_X + 12, HUD_Y, 'MENU MAP', {
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
      .text(PANEL_X + 140, HUD_Y, 'MENU GŁÓWNE', {
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

  private resetEditor(): void {
    this.map = generateMap();
    this.mapId = null;
    this.mapName = 'nowa';
    this.hover = null;
    this.panning = false;
    this.paintButton = null;
    this.painted = null;
    this.shiftDown = false;
    this.mapCpuMs = 0;
    this.lastOperationMs = 0;
    this.mapBytes = 0;
  }

  update(_time: number, delta: number): void {
    if (this.devOverlay) {
      this.refreshDevBar(delta);
    }

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
    _pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
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

    if (key === 'f' && this.devTools) {
      this.devOverlay = !this.devOverlay;
      this.devBar?.setVisible(this.devOverlay);
      this.refreshHud();
      return;
    }

    if (key === 'x') {
      this.map = this.measure(() => clearMap());
      this.syncView();
      return;
    }

    if (event.shiftKey) {
      const edge = EDGE_BY_KEY[key];

      if (edge) {
        this.extendEdge(edge);
        return;
      }
    }

    const terrain = TERRAIN_IDS[Number(key) - 1];
    if (terrain) {
      this.brush = terrain;
      this.refreshHud();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.shiftDown = false;
    }
  }

  private extendEdge(edge: MapEdge): void {
    this.map = this.measure(() => extendMap(this.map, edge, 1, this.brush));
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
      this.registry.set(`map:draft:${this.mapId}`, this.map);
    }

    this.scene.start(target);
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
    this.map = this.measure(() =>
      button === 2
        ? removeTerrain(this.map, coord)
        : setTerrain(this.map, coord, this.brush),
    );

    this.syncView();
  }

  private syncView(): void {
    const started = performance.now();
    this.mapView.setMap(this.map);
    this.mapCpuMs += performance.now() - started;
    this.mapBytes = mapMemoryUsage(this.map);

    this.updateCameraBounds();
    this.refreshHud();
  }

  private updateCameraBounds(): void {
    const camera = this.cameras.main;
    const bounds = mapPixelBounds(this.map, HEX_SIZE) ?? BASE_BOUNDS;

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
    lines.push(`Pędzel: ${TERRAIN_DEFS[this.brush].label}`);

    if (this.hover) {
      const terrain = terrainAt(this.map, this.hover);
      const label = terrain ? ` — ${TERRAIN_DEFS[terrain].label}` : ' — pusto';
      const hex = toDoubled(this.hover);

      lines.push(`Heks: ${hex.col}, ${hex.row}${label}`);
    } else {
      lines.push('Heks: —');
    }

    const bounds = mapDoubledBounds(this.map);
    lines.push(`Kafelki: ${Object.keys(this.map.cells).length}`);

    if (bounds) {
      lines.push(`Zasięg: ${bounds.minCol}-${bounds.maxCol} × ${bounds.minRow}-${bounds.maxRow}`);
    } else {
      lines.push('Zasięg: —');
    }

    lines.push('');
    lines.push('Kolumna = 2q + r · wiersz = r');
    lines.push('LPM — maluj (można ciągnąć)');
    lines.push('PPM — usuń kafel');
    lines.push('1-7 teren · X — wyczyść mapę');
    lines.push('Shift+strzałki — kafelki na krawędzi');
    lines.push('Strzałki / WASD — kamera');
    lines.push('Kółko — zoom · środkowy — przesuń');
    lines.push('ESC — menu map · Shift+ESC — menu główne');

    if (this.devTools) {
      lines.push('F — dev (FPS, CPU, pamięć)');
    }

    this.hud.setText(lines.join('\n'));
    this.panel.setSize(
      Math.max(PANEL_WIDTH, this.hud.width + 24),
      HUD_Y + this.hud.height + BUTTONS_Y - PANEL_Y,
    );
    this.drawSwatches();
    this.drawButtons();
  }

  private drawButtons(): void {
    const y = HUD_Y + this.hud.height + 4;

    this.mapButton.setY(y);
    this.menuButton.setY(y);
  }

  private refreshDevBar(delta: number): void {
    this.devBar?.update(delta, {
      tiles: this.mapView.tileCount,
      cpuMs: this.mapCpuMs,
      lastOperationMs: this.lastOperationMs,
      mapBytes: this.mapBytes,
    });
  }

  private drawSwatches(): void {
    TERRAIN_IDS.forEach((terrain, index) => {
      const swatch = this.swatches[index];
      if (!swatch) {
        return;
      }

      const selected = terrain === this.brush;
      swatch.setScale(selected ? 1.25 : 1);
      swatch.setAlpha(selected ? 1 : 0.7);
    });
  }
}
