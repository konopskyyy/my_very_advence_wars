import Phaser from 'phaser';

export interface ShotPoint {
  readonly x: number;
  readonly y: number;
}

const FX_DEPTH = 7;
const TRACER_MS = 260;
const TRACER_RADIUS = 5;
const TRACER_GLOW_RADIUS = 12;
const TRACER_COLOR = 0xffe08a;
const TRACER_GLOW_COLOR = 0xffb347;
const FLASH_COLOR = 0xff8c42;
const IMPACT_MS = 320;
const RING_MS = 380;
const SPARK_COUNT = 10;
const SPARK_DISTANCE = 28;

type CreateHook = (object: Phaser.GameObjects.GameObject) => void;

export function playShotEffect(
  scene: Phaser.Scene,
  from: ShotPoint,
  to: ShotPoint,
  onImpact: () => void,
  onCreate?: CreateHook,
): void {
  playMuzzleFlash(scene, from, onCreate);
  const trail = playTrail(scene, from, to, onCreate);
  playTracer(scene, from, to, onCreate, () => {
    trail.destroy();
    playImpact(scene, to, onCreate);
    onImpact();
  });
}

function playMuzzleFlash(scene: Phaser.Scene, at: ShotPoint, onCreate?: CreateHook): void {
  const muzzle = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(muzzle);
  muzzle.fillStyle(FLASH_COLOR, 0.45);
  muzzle.fillCircle(0, 0, 18);
  muzzle.fillStyle(0xfff3b0, 0.95);
  muzzle.fillCircle(0, 0, 9);
  muzzle.setPosition(at.x, at.y);

  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: 2.4,
    duration: 180,
    ease: 'Quad.easeOut',
    onComplete: () => muzzle.destroy(),
  });
}

function playTrail(
  scene: Phaser.Scene,
  from: ShotPoint,
  to: ShotPoint,
  onCreate?: CreateHook,
): Phaser.GameObjects.Graphics {
  const trail = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(trail);
  trail.lineStyle(7, TRACER_GLOW_COLOR, 0.28);
  trail.lineBetween(from.x, from.y, to.x, to.y);
  trail.lineStyle(2.5, TRACER_COLOR, 0.85);
  trail.lineBetween(from.x, from.y, to.x, to.y);

  return trail;
}

function playTracer(
  scene: Phaser.Scene,
  from: ShotPoint,
  to: ShotPoint,
  onCreate: CreateHook | undefined,
  onImpact: () => void,
): void {
  const tracer = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(tracer);
  tracer.fillStyle(TRACER_GLOW_COLOR, 0.4);
  tracer.fillCircle(0, 0, TRACER_GLOW_RADIUS);
  tracer.fillStyle(TRACER_COLOR, 1);
  tracer.fillCircle(0, 0, TRACER_RADIUS);
  tracer.setPosition(from.x, from.y);

  scene.tweens.add({
    targets: tracer,
    x: to.x,
    y: to.y,
    duration: TRACER_MS,
    ease: 'Quad.easeIn',
    onComplete: () => {
      tracer.destroy();
      onImpact();
    },
  });
}

function playImpact(scene: Phaser.Scene, at: ShotPoint, onCreate?: CreateHook): void {
  playImpactRing(scene, at, onCreate);

  const flash = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(flash);
  flash.fillStyle(FLASH_COLOR, 0.85);
  flash.fillCircle(0, 0, 13);
  flash.fillStyle(0xfff3b0, 0.9);
  flash.fillCircle(0, 0, 6);
  flash.setPosition(at.x, at.y);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 2.6,
    duration: IMPACT_MS,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  for (let index = 0; index < SPARK_COUNT; index += 1) {
    const angle = (Math.PI * 2 * index) / SPARK_COUNT;
    const distance = index % 2 === 0 ? SPARK_DISTANCE : SPARK_DISTANCE * 0.6;
    const spark = scene.add.graphics().setDepth(FX_DEPTH);
    onCreate?.(spark);
    spark.fillStyle(0xffc06a, 0.9);
    spark.fillCircle(0, 0, index % 2 === 0 ? 3 : 2);
    spark.setPosition(at.x, at.y);

    scene.tweens.add({
      targets: spark,
      x: at.x + Math.cos(angle) * distance,
      y: at.y + Math.sin(angle) * distance,
      alpha: 0,
      duration: IMPACT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}

function playImpactRing(scene: Phaser.Scene, at: ShotPoint, onCreate?: CreateHook): void {
  const ring = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(ring);
  ring.lineStyle(3, TRACER_COLOR, 0.9);
  ring.strokeCircle(0, 0, 10);
  ring.setPosition(at.x, at.y);

  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 3.2,
    duration: RING_MS,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}
