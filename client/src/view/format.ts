import { FULL_MAP_RANGE } from '../core/units';

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('pl-PL');
}

export function formatRange(value: number): string {
  return value >= FULL_MAP_RANGE ? '∞' : formatPoints(value);
}

export function formatPoints(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
