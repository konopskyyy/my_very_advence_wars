export const MAP_NAME_MAX_LENGTH = 32;

export function normalizeMapName(value: string): string {
  return value.trim().slice(0, MAP_NAME_MAX_LENGTH);
}
