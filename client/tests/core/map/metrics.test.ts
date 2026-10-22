import { describe, expect, it } from 'vitest';
import { mapMemoryUsage, measureMapOperation } from '../../../src/core/map/metrics';
import { createMap } from '../../../src/core/map/model';

describe('measureMapOperation', () => {
  it('zwraca wynik operacji i czas jej trwania', () => {
    const measured = measureMapOperation(() => 42);

    expect(measured.result).toBe(42);
    expect(measured.ms).toBeGreaterThanOrEqual(0);
  });

  it('mierzy realny czas pracy', () => {
    const measured = measureMapOperation(() => {
      let sum = 0;

      for (let index = 0; index < 500_000; index += 1) {
        sum += index;
      }

      return sum;
    });

    expect(measured.result).toBe(124_999_750_000);
    expect(measured.ms).toBeGreaterThan(0);
  });
});

describe('mapMemoryUsage', () => {
  it('liczy rozmiar modelu w bajtach', () => {
    const map = createMap(2, 2);

    expect(mapMemoryUsage(map)).toBe(57);
  });

  it('rośnie z liczbą kafelków', () => {
    const small = mapMemoryUsage(createMap(2, 2));
    const large = mapMemoryUsage(createMap(8, 8));

    expect(large).toBeGreaterThan(small);
  });
});
