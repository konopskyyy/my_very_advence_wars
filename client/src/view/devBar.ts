import Phaser from 'phaser';
import { FrameMeter } from './frameMeter';

export interface DevBarMetrics {
  readonly tiles: number;
  readonly cpuMs: number;
  readonly lastOperationMs: number;
  readonly mapBytes: number;
  readonly heapBytes?: number;
}

interface PerformanceWithMemory extends Performance {
  readonly memory?: { readonly usedJSHeapSize: number };
}

export class DevBar {
  private readonly text: Phaser.GameObjects.Text;
  private readonly meter = new FrameMeter();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.text = scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#a6f4c5',
      align: 'right',
    });
    this.text.setOrigin(1, 0);
    this.text.setScrollFactor(0);
    this.text.setDepth(11);
  }

  update(delta: number, metrics: DevBarMetrics): void {
    this.meter.update(delta);

    const lines = [
      `${this.meter.fps.toFixed(0)} FPS · ${this.meter.frameTime.toFixed(1)} ms`,
      `kafle: ${metrics.tiles}`,
      `CPU mapy: ${metrics.cpuMs.toFixed(1)} ms (ostatnia operacja ${metrics.lastOperationMs.toFixed(1)} ms)`,
      `pamięć mapy: ${formatBytes(metrics.mapBytes)}`,
    ];

    const heap = heapBytes();

    if (heap !== undefined) {
      lines.push(`heap: ${formatBytes(heap)}`);
    }

    this.text.setText(lines.join('\n'));
  }

  setVisible(visible: boolean): void {
    this.text.setVisible(visible);
  }
}

export function heapBytes(): number | undefined {
  return (performance as PerformanceWithMemory).memory?.usedJSHeapSize;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
