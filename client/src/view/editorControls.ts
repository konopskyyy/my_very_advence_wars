import Phaser from 'phaser';
import type { HexCoord, MapEdge } from '../core/map';
import { outlineHex } from './hexGrid';
import type { MapViewport } from './mapViewport';

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

export interface EditorControlHandlers {
  readonly isNameEditing: () => boolean;
  readonly commitName: () => void;
  readonly handleNameKey: (event: KeyboardEvent) => void;
  readonly onHoverChange: () => void;
  readonly onPaint: (coord: HexCoord, button: number) => void;
  readonly onClear: () => void;
  readonly onExtend: (edge: MapEdge) => void;
  readonly onLeave: (shift: boolean) => void;
}

export class EditorControls {
  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private readonly cursor: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private hover: HexCoord | null = null;
  private paintButton: number | null = null;
  private painted: { coord: HexCoord; button: number } | null = null;
  private shiftDown = false;
  private edgeGrowthMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly viewport: MapViewport,
    private readonly panelContains: (pointer: Phaser.Input.Pointer) => boolean,
    private readonly handlers: EditorControlHandlers,
  ) {
    this.cursor = scene.add.graphics();
    this.cursor.setDepth(5);

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('wheel', this.onWheel, this);

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      for (const code of ['W', 'A', 'S', 'D']) {
        this.keys.set(code, keyboard.addKey(code));
      }
      keyboard.on('keydown', this.onKeyDown, this);
      keyboard.on('keyup', this.onKeyUp, this);
    }
  }

  get currentHover(): HexCoord | null {
    return this.hover;
  }

  update(delta: number): void {
    if (this.handlers.isNameEditing()) {
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

  releaseKeys(): void {
    this.shiftDown = false;
    this.keys.forEach((key) => key.reset());
  }

  clearHover(): void {
    this.hover = null;
    this.cursor.clear();
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('wheel', this.onWheel, this);

    const keyboard = this.scene.input.keyboard;
    keyboard?.off('keydown', this.onKeyDown, this);
    keyboard?.off('keyup', this.onKeyUp, this);
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
    this.handlers.onExtend(edge);
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

    if (this.panelContains(pointer)) {
      return;
    }

    if (this.handlers.isNameEditing()) {
      this.handlers.commitName();
    }

    if (pointer.button !== 0 && pointer.button !== 2) {
      return;
    }

    this.paintButton = pointer.button;
    this.paintAt(this.viewport.hexAt(pointer), pointer.button);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.viewport.movePan(pointer)) {
      return;
    }

    if (this.panelContains(pointer)) {
      this.paintButton = null;
      this.painted = null;

      if (this.hover) {
        this.clearHover();
        this.handlers.onHoverChange();
      }

      return;
    }

    const coord = this.viewport.hexAt(pointer);

    if (this.paintButton !== null && pointer.isDown) {
      this.paintAt(coord, this.paintButton);
    }

    if (coord.col === this.hover?.col && coord.row === this.hover?.row) {
      return;
    }

    this.hover = coord;

    this.cursor.clear();
    outlineHex(this.cursor, this.viewport.center(coord), 0xffffff, 2);

    this.handlers.onHoverChange();
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
    if (this.panelContains(pointer)) {
      return;
    }

    this.viewport.zoom(deltaY);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.handlers.isNameEditing()) {
      this.handlers.handleNameKey(event);
      return;
    }

    if (event.key === 'Shift') {
      this.shiftDown = true;
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'escape') {
      this.handlers.onLeave(event.shiftKey);
      return;
    }

    if (key === 'x') {
      this.handlers.onClear();
      return;
    }

    if (event.shiftKey) {
      const edge = EDGE_BY_KEY[key];

      if (edge) {
        this.handlers.onExtend(edge);
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.shiftDown = false;
    }
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
    this.handlers.onPaint(coord, button);
  }
}
