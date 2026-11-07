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

function fakeScene(): {
  scene: Phaser.Scene;
  tweens: { killTweensOf: ReturnType<typeof vi.fn>; add: ReturnType<typeof vi.fn> };
} {
  const tweens = {
    killTweensOf: vi.fn(),
    add: vi.fn(),
  };

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
    tweens,
  };

  return { scene: scene as unknown as Phaser.Scene, tweens };
}

function unitAt(id: string, col: number, row: number) {
  return createUnit(id, 'infantry', 'blue', { col, row });
}

describe('UnitLayer — animacja ruchu', () => {
  it('przesuwa token tweenem zamiast skakać od razu do celu', () => {
    const { scene, tweens } = fakeScene();
    const layer = new UnitLayer(scene, [unitAt('u1', 1, 1)]);
    const token = layer.getToken('u1') as unknown as FakeToken;
    const target = { col: 3, row: 2 };
    const destination = layer.center(target);

    expect(token.setPosition).toHaveBeenCalledTimes(1);

    layer.setUnits([unitAt('u1', target.col, target.row)]);

    expect(tweens.killTweensOf).toHaveBeenCalledWith(token);
    expect(tweens.add).toHaveBeenCalledTimes(1);
    expect(tweens.add).toHaveBeenCalledWith({
      targets: token,
      x: destination.x,
      y: destination.y,
      duration: expect.any(Number),
      ease: expect.any(String),
    });
    expect(token.setPosition).not.toHaveBeenCalledWith(destination.x, destination.y);
  });

  it('nie nadpisuje trwającej animacji skokiem, gdy animate jest wyłączone', () => {
    const { scene, tweens } = fakeScene();
    const layer = new UnitLayer(scene, [unitAt('u1', 1, 1)]);
    const token = layer.getToken('u1') as unknown as FakeToken;
    const target = { col: 2, row: 2 };
    const destination = layer.center(target);

    layer.setUnits([unitAt('u1', target.col, target.row)], false);

    expect(tweens.add).not.toHaveBeenCalled();
    expect(token.setPosition).toHaveBeenCalledTimes(1);
    expect(token.setPosition).not.toHaveBeenCalledWith(destination.x, destination.y);
  });

  it('animuje token po rzeczywistym ruchu wykonanym przez moveUnit', () => {
    const { scene, tweens } = fakeScene();
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

    expect(next).not.toBe(state);

    layer.setUnits(visibleUnits(next, 'blue'));

    expect(tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        x: destination.x,
        y: destination.y,
      }),
    );
  });
});
