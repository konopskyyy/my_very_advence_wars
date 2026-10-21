import { describe, expect, it } from 'vitest';
import { hexDistance, hexEquals, hexKey, hexNeighbors, hexRing, hexesInRange } from './hex';

describe('hexDistance', () => {
  it('wynosi 0 dla tego samego heksa', () => {
    expect(hexDistance({ q: 4, r: 2 }, { q: 4, r: 2 })).toBe(0);
  });

  it('wynosi 1 dla sąsiadów (w wierszu i po skosie)', () => {
    expect(hexDistance({ q: 2, r: 0 }, { q: 4, r: 0 })).toBe(1);
    expect(hexDistance({ q: 2, r: 0 }, { q: 3, r: 1 })).toBe(1);
    expect(hexDistance({ q: 2, r: 0 }, { q: 1, r: 1 })).toBe(1);
  });

  it('liczy odległość w wierszach i półkrokach kolumny', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 6, r: 0 })).toBe(3);
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 4 })).toBe(4);
    expect(hexDistance({ q: 0, r: 0 }, { q: 4, r: 2 })).toBe(3);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 2 })).toBe(2);
  });

  it('dla prawidłowych heksów zawsze zwraca całkowitą wartość', () => {
    for (let q = -6; q <= 6; q++) {
      for (let r = -6; r <= 6; r++) {
        if (((q - r) % 2 + 2) % 2 !== 0) continue;
        expect(Number.isInteger(hexDistance({ q: 0, r: 0 }, { q, r }))).toBe(true);
      }
    }
  });
});

describe('hexNeighbors', () => {
  it('zwraca 6 heksów w odległości 1', () => {
    const center = { q: 4, r: 2 };
    const neighbors = hexNeighbors(center);

    expect(neighbors).toHaveLength(6);
    for (const neighbor of neighbors) {
      expect(hexDistance(center, neighbor)).toBe(1);
    }
    expect(new Set(neighbors.map(hexKey)).size).toBe(6);
  });

  it('sąsiedzi zachowują parzystość q zgodną z r', () => {
    for (const neighbor of hexNeighbors({ q: 4, r: 2 })) {
      expect(((neighbor.q - neighbor.r) % 2 + 2) % 2).toBe(0);
    }
  });
});

describe('hexesInRange', () => {
  it('promień 0 to tylko środek', () => {
    expect(hexesInRange({ q: 4, r: 2 }, 0)).toEqual([{ q: 4, r: 2 }]);
  });

  it('promień n ma 3n² + 3n + 1 heksów', () => {
    expect(hexesInRange({ q: 4, r: 2 }, 1)).toHaveLength(7);
    expect(hexesInRange({ q: 4, r: 2 }, 2)).toHaveLength(19);
    expect(hexesInRange({ q: 4, r: 2 }, 3)).toHaveLength(37);
  });

  it('każdy heks mieści się w zadanym promieniu i ma poprawną parzystość', () => {
    const center = { q: 4, r: 2 };
    for (const hex of hexesInRange(center, 3)) {
      expect(hexDistance(center, hex)).toBeLessThanOrEqual(3);
      expect(((hex.q - hex.r) % 2 + 2) % 2).toBe(0);
    }
  });
});

describe('hexRing', () => {
  it('promień 0 to środek', () => {
    expect(hexRing({ q: 4, r: 2 }, 0)).toEqual([{ q: 4, r: 2 }]);
  });

  it('promień n ma 6n heksów', () => {
    expect(hexRing({ q: 0, r: 0 }, 1)).toHaveLength(6);
    expect(hexRing({ q: 0, r: 0 }, 3)).toHaveLength(18);
  });

  it('wszystkie heksy pierścienia są dokładnie w odległości n', () => {
    const center = { q: 4, r: 2 };
    for (const radius of [1, 2, 3]) {
      for (const hex of hexRing(center, radius)) {
        expect(hexDistance(center, hex)).toBe(radius);
      }
    }
  });
});

describe('hexEquals', () => {
  it('porównuje obie współrzędne', () => {
    expect(hexEquals({ q: 1, r: 1 }, { q: 1, r: 1 })).toBe(true);
    expect(hexEquals({ q: 1, r: 1 }, { q: 1, r: 3 })).toBe(false);
  });
});
