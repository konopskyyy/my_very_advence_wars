import type { Hex } from './core/hex';

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 270;

const SQRT3 = Math.sqrt(3);

export const HEX_SIZE = 16;
export const HEX_WIDTH = SQRT3 * HEX_SIZE;
export const COLUMN_STEP = HEX_WIDTH / 2;
export const ROW_STEP = 1.5 * HEX_SIZE;

export const HEX_VERTICES: readonly (readonly [number, number])[] = Array.from(
  { length: 6 },
  (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return [HEX_SIZE * Math.cos(angle), HEX_SIZE * Math.sin(angle)] as const;
  },
);

export const HEX_ORIGIN_X = HEX_WIDTH / 2;
export const HEX_ORIGIN_Y = HEX_SIZE;

export function hexToPixel({ q, r }: Hex): { x: number; y: number } {
  return {
    x: HEX_ORIGIN_X + COLUMN_STEP * q,
    y: HEX_ORIGIN_Y + ROW_STEP * r,
  };
}

export function pixelToHex(x: number, y: number): Hex {
  const localY = y - HEX_ORIGIN_Y;
  const row = Math.round(localY / ROW_STEP);
  const column = Math.round((x - HEX_ORIGIN_X) / COLUMN_STEP);
  const q = column + (((column - row) % 2 + 2) % 2);
  return { q, r: row };
}

export const BOARD_ROWS = Math.ceil(BOARD_HEIGHT / ROW_STEP) + 1;
export const BOARD_COLUMNS = Math.ceil(BOARD_WIDTH / COLUMN_STEP) + 2;

export function boardHexAt(column: number, row: number): Hex {
  return { q: 2 * column + (row & 1), r: row };
}

// Kolumna odtwarza się z q i parzystości wiersza, więc heks spoza siatki
// (np. q = -2) daje kolumnę -1 albo ułamek.
export function isBoardHex({ q, r }: Hex): boolean {
  if (r < 0 || r >= BOARD_ROWS) return false;

  const column = (q - (r & 1)) / 2;
  return Number.isInteger(column) && column >= 0 && column < BOARD_COLUMNS;
}

export const BOARD_TILES: readonly Hex[] = Array.from({ length: BOARD_ROWS }, (_value, row) =>
  Array.from({ length: BOARD_COLUMNS }, (_unused, column) => boardHexAt(column, row)),
).flat();
