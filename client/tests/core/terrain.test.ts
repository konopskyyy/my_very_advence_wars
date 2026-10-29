import { describe, expect, it } from 'vitest';
import { pickVariantIndex } from '../../src/core/terrain';

describe('pickVariantIndex', () => {
  it('zwraca 0, gdy teren nie ma wariantów', () => {
    expect(pickVariantIndex(0, () => 0.9)).toBe(0);
    expect(pickVariantIndex(-1, () => 0.9)).toBe(0);
  });

  it('losuje indeks z zakresu wariantów', () => {
    expect(pickVariantIndex(2, () => 0)).toBe(0);
    expect(pickVariantIndex(2, () => 0.49)).toBe(0);
    expect(pickVariantIndex(2, () => 0.5)).toBe(1);
    expect(pickVariantIndex(2, () => 0.99)).toBe(1);
  });

  it('nie wychodzi poza ostatni wariant', () => {
    expect(pickVariantIndex(3, () => 1)).toBe(2);
  });
});
