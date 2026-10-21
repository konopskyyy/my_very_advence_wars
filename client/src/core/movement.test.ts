import { describe, expect, it } from 'vitest';
import { canMoveTo } from './movement';
import { Terrain } from './terrain';
import { hexKey } from './hex';

const terrainAt = (terrain: Terrain) => () => terrain;

describe('canMoveTo', () => {
  it('pozwala wejść na sąsiednią równinę', () => {
    expect(canMoveTo({ q: 4, r: 2 }, { q: 6, r: 2 }, terrainAt(Terrain.Plains))).toEqual({ ok: true });
  });

  it('pozwala wejść na sąsiednie miasto i las', () => {
    expect(canMoveTo({ q: 4, r: 2 }, { q: 5, r: 3 }, terrainAt(Terrain.City)).ok).toBe(true);
    expect(canMoveTo({ q: 4, r: 2 }, { q: 3, r: 3 }, terrainAt(Terrain.Forest)).ok).toBe(true);
  });

  it('blokuje wodę i góry', () => {
    expect(canMoveTo({ q: 4, r: 2 }, { q: 6, r: 2 }, terrainAt(Terrain.Water))).toEqual({
      ok: false,
      reason: 'impassable',
    });
    expect(canMoveTo({ q: 4, r: 2 }, { q: 6, r: 2 }, terrainAt(Terrain.Mountain))).toEqual({
      ok: false,
      reason: 'impassable',
    });
  });

  it('blokuje heks spoza mapy', () => {
    expect(canMoveTo({ q: 4, r: 2 }, { q: 9, r: 9 }, () => undefined)).toEqual({
      ok: false,
      reason: 'not-adjacent',
    });
    expect(canMoveTo({ q: 4, r: 2 }, { q: 6, r: 2 }, () => undefined)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
  });

  it('blokuje heks odległy o więcej niż 1', () => {
    expect(canMoveTo({ q: 0, r: 0 }, { q: 4, r: 0 }, terrainAt(Terrain.Plains))).toEqual({
      ok: false,
      reason: 'not-adjacent',
    });
  });

  it('blokuje brak ruchu na ten sam heks', () => {
    expect(canMoveTo({ q: 3, r: 1 }, { q: 3, r: 1 }, terrainAt(Terrain.Plains))).toEqual({
      ok: false,
      reason: 'not-adjacent',
    });
  });

  it('działa dla ujemnych współrzędnych', () => {
    const hex = { q: -2, r: 0 };
    expect(hexKey(hex)).toBe('-2,0');
    expect(canMoveTo(hex, { q: -1, r: 1 }, terrainAt(Terrain.Plains)).ok).toBe(true);
  });
});
