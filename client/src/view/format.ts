export function formatTimestamp(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('pl-PL');
}

export function formatPoints(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
