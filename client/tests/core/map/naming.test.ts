import { describe, expect, it } from 'vitest';
import { MAP_NAME_MAX_LENGTH, normalizeMapName } from '../../../src/core/map/naming';

describe('normalizeMapName', () => {
  it('przycina białe znaki z obu stron', () => {
    expect(normalizeMapName('  Front Wschodni  ')).toBe('Front Wschodni');
  });

  it('ogranicza długość nazwy', () => {
    const long = 'a'.repeat(MAP_NAME_MAX_LENGTH + 8);

    expect(normalizeMapName(long)).toBe('a'.repeat(MAP_NAME_MAX_LENGTH));
  });

  it('zwraca pustą nazwę dla samej bieli', () => {
    expect(normalizeMapName('   ')).toBe('');
    expect(normalizeMapName('')).toBe('');
  });
});
