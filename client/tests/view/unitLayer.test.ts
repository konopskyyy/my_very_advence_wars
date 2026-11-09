import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createMap } from '../../src/core/map';
import { findUnitAt, moveUnit } from '../../src/core/map/movement';
import { createInitialState, placeUnit } from '../../src/core/state';
import { createUnit } from '../../src/core/units';
import { visibleUnits } from '../../src/core/vision';
import { UnitLayer } from '../../src/view/unitLayer';

vi.mock('phaser', () => ({ default: {} }));

class FakeToken {
  x = 0;
  y = 0;
  texture = { key: '' };

  setDepth = vi.fn(() => this);

  setPosition = vi.fn((x: number, y: number) => {
    this.x = x;
    this.y = y;

    return this;
  });

  destroy = vi.fn();
}

function fakeContext(): CanvasRenderingContext2D {
  return new Proxy({} as CanvasRenderingContext2D, {
    get: () => () => undefined,
    set: () => true,
  });
}

function fakeScene(): Phaser.Scene {
  const scene = {
    textures: {
      exists: vi.fn(() => false),
      createCanvas: vi.fn(() => ({
        getContext: () => fakeContext(),
        refresh: vi.fn(),
      })),
    },
    add: {
      image: vi.fn((_x: number, _y: number, key: string) => {
        const token = new FakeToken();
        token.texture.key = key;

        return token;
      }),
    },
  };

  return scene as unknown as Phaser.Scene;
}

function unitAt(id: string, col: number, row: number) {
  return createUnit(id, 'infantry', 'blue', { col, row });
}

describe('UnitLayer — animacja ruchu', () => {
  it('przesuwa token po kolejnych aktualizacjach zamiast skakać do celu', () => {
    const scene = fakeScene();
    const layer = new UnitLayer(scene, [unitAt('u1', 1, 1)]);
    const token = layer.getToken('u1') as unknown as FakeToken;
    const target = { col: 3, row: 2 };
    const destination = layer.center(target);
    const startX = token.x;
    const startY = token.y;

    layer.setUnits([unitAt('u1', target.col, target.row)]);

    expect(token.x).toBe(startX);
    expect(token.y).toBe(startY);

    layer.update(125);

    expect(token.x).not.toBe(startX);
    expect(token.x).not.toBe(destination.x);

    layer.update(125);

    expect(token.x).toBeCloseTo(destination.x);
    expect(token.y).toBeCloseTo(destination.y);
  });

  it('ustawia token od razu w celu, gdy animacja jest wyłączona', () => {
    const scene = fakeScene();
    const layer = new UnitLayer(scene, [unitAt('u1', 1, 1)]);
    const token = layer.getToken('u1') as unknown as FakeToken;
    const target = { col: 2, row: 2 };
    const destination = layer.center(target);

    layer.setUnits([unitAt('u1', target.col, target.row)], false);

    expect(token.setPosition).toHaveBeenLastCalledWith(destination.x, destination.y);
    expect(token.x).toBeCloseTo(destination.x);
    expect(token.y).toBeCloseTo(destination.y);
  });

  it('nie cofa tokenu, gdy odświeżenie przyjdzie w trakcie animacji', () => {
    const scene = fakeScene();
    const layer = new UnitLayer(scene, [unitAt('u1', 1, 1)]);
    const token = layer.getToken('u1') as unknown as FakeToken;
    const target = { col: 2, row: 1 };
    const destination = layer.center(target);

    layer.setUnits([unitAt('u1', target.col, target.row)]);
    layer.update(100);
    const midway = token.x;

    layer.setUnits([unitAt('u1', target.col, target.row)]);

    expect(token.x).toBe(midway);

    layer.update(150);

    expect(token.x).toBeCloseTo(destination.x);
  });

  it('animuje token po rzeczywistym ruchu wykonanym przez moveUnit', () => {
    const scene = fakeScene();
    const state = placeUnit(
      createInitialState(createMap(9, 9)),
      'infantry',
      { col: 1, row: 1 },
      'blue',
    );
    const unit = findUnitAt(state, { col: 1, row: 1 });
    const layer = new UnitLayer(scene, visibleUnits(state, 'blue'));

    expect(unit).toBeDefined();

    const next = moveUnit(state, unit!.id, { col: 2, row: 1 });
    const destination = layer.center({ col: 2, row: 1 });
    const token = layer.getToken(unit!.id) as unknown as FakeToken;
    const startX = token.x;

    expect(next).not.toBe(state);

    layer.setUnits(visibleUnits(next, 'blue'));
    layer.update(250);

    expect(token.x).toBeCloseTo(destination.x);
    expect(token.x).not.toBe(startX);
  });
});
