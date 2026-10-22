import type { GameMap } from './model';

export interface MeasuredOperation<T> {
  readonly result: T;
  readonly ms: number;
}

export function measureMapOperation<T>(operation: () => T): MeasuredOperation<T> {
  const started = performance.now();
  const result = operation();

  return { result, ms: performance.now() - started };
}

export function mapMemoryUsage(map: GameMap): number {
  return new TextEncoder().encode(JSON.stringify(map.cells)).length;
}
