import Phaser from 'phaser';
import {
  hexToPixel,
  mapPixelBounds,
  pixelToHex,
  type GameMap,
  type HexCoord,
} from '../core/map';
import { HEX_SIZE } from './hexGrid';

export interface MapViewportOptions {
  readonly zoomMin: number;
  readonly zoomMax: number;
  readonly startZoom?: number;
  readonly panSpeed?: number;
  readonly edgePanSpeed?: number;
  readonly edgePanMargin?: number;
  readonly edgePanBlocked?: (pointer: Phaser.Input.Pointer) => boolean;
  readonly margin?: number;
  readonly size?: number;
}

export interface CameraAxis {
  readonly left: boolean;
  readonly right: boolean;
  readonly up: boolean;
  readonly down: boolean;
}

const DEFAULT_PAN_SPEED = 420;
const DEFAULT_EDGE_PAN_SPEED = 620;
const DEFAULT_EDGE_PAN_MARGIN = 24;
const DEFAULT_MARGIN = HEX_SIZE * 8;

const NO_AXIS: CameraAxis = { left: false, right: false, up: false, down: false };

export class MapViewport {
  private map: GameMap;
  private panning = false;
  private panAnchor = { x: 0, y: 0, scrollX: 0, scrollY: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    map: GameMap,
    private readonly options: MapViewportOptions,
  ) {
    this.map = map;
    this.scene.cameras.main.setZoom(options.startZoom ?? 1);
    this.applyBounds();
  }

  get isPanning(): boolean {
    return this.panning;
  }

  get size(): number {
    return this.options.size ?? HEX_SIZE;
  }

  setMap(map: GameMap): void {
    this.map = map;
    this.applyBounds();
  }

  update(delta: number, axis: CameraAxis): void {
    const camera = this.scene.cameras.main;
    const keyStep = ((this.options.panSpeed ?? DEFAULT_PAN_SPEED) * delta) / 1000;
    const edgeStep =
      ((this.options.edgePanSpeed ?? DEFAULT_EDGE_PAN_SPEED) * delta) / 1000;
    const edge = this.edgeAxis();
    const dx = Number(axis.right) - Number(axis.left);
    const dy = Number(axis.down) - Number(axis.up);
    const edgeDx = Number(edge.right) - Number(edge.left);
    const edgeDy = Number(edge.down) - Number(edge.up);

    camera.scrollX += dx * keyStep + edgeDx * edgeStep;
    camera.scrollY += dy * keyStep + edgeDy * edgeStep;
  }

  startPan(pointer: Phaser.Input.Pointer): boolean {
    if (pointer.button !== 1) {
      return false;
    }

    const camera = this.scene.cameras.main;

    this.panning = true;
    this.panAnchor = {
      x: pointer.x,
      y: pointer.y,
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
    };

    return true;
  }

  movePan(pointer: Phaser.Input.Pointer): boolean {
    if (!this.panning) {
      return false;
    }

    const camera = this.scene.cameras.main;

    camera.scrollX = this.panAnchor.scrollX - (pointer.x - this.panAnchor.x);
    camera.scrollY = this.panAnchor.scrollY - (pointer.y - this.panAnchor.y);

    return true;
  }

  endPan(): void {
    this.panning = false;
  }

  zoom(deltaY: number): void {
    const camera = this.scene.cameras.main;
    const zoom = camera.zoom + (deltaY > 0 ? -0.15 : 0.15);

    camera.setZoom(Phaser.Math.Clamp(zoom, this.options.zoomMin, this.options.zoomMax));
  }

  hexAt(pointer: Phaser.Input.Pointer): HexCoord {
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    return pixelToHex(world.x, world.y, this.size);
  }

  center(coord: HexCoord): { x: number; y: number } {
    return hexToPixel(coord, this.size);
  }

  centerOn(coord: HexCoord): void {
    const center = this.center(coord);

    this.scene.cameras.main.centerOn(center.x, center.y);
  }

  private edgeAxis(): CameraAxis {
    const margin = this.options.edgePanMargin ?? DEFAULT_EDGE_PAN_MARGIN;

    if (margin <= 0 || this.panning || !this.scene.input.isOver) {
      return NO_AXIS;
    }

    const pointer = this.scene.input.activePointer;

    if (pointer.isDown) {
      return NO_AXIS;
    }

    const left = pointer.x <= margin;
    const right = pointer.x >= this.scene.scale.width - margin;
    const up = pointer.y <= margin;
    const down = pointer.y >= this.scene.scale.height - margin;

    if ((!left && !right && !up && !down) || this.options.edgePanBlocked?.(pointer)) {
      return NO_AXIS;
    }

    return { left, right, up, down };
  }

  private applyBounds(): void {
    const bounds = mapPixelBounds(this.map, this.size);
    const margin = this.options.margin ?? DEFAULT_MARGIN;
    const camera = this.scene.cameras.main;

    if (!bounds) {
      camera.setBounds(
        -margin,
        -margin,
        this.scene.scale.width + margin * 2,
        this.scene.scale.height + margin * 2,
      );
      return;
    }

    camera.setBounds(
      bounds.left - margin,
      bounds.top - margin,
      bounds.right - bounds.left + margin * 2,
      bounds.bottom - bounds.top + margin * 2,
    );
  }
}
