import Phaser from 'phaser';

export interface ShotPoint {
  readonly x: number;
  readonly y: number;
}

const FX_DEPTH = 7;
const TRACER_MS = 160;
const TRACER_RADIUS = 4;
const TRACER_COLOR = 0xffe08a;
const FLASH_COLOR = 0xff8c42;
const IMPACT_MS = 240;
const SPARK_COUNT = 6;
const SPARK_DISTANCE = 20;

type CreateHook = (object: Phaser.GameObjects.GameObject) => void;

export function playShotEffect(
  scene: Phaser.Scene,
  from: ShotPoint,
  to: ShotPoint,
  onImpact: () => void,
  onCreate?: CreateHook,
): void {
  const muzzle = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(muzzle);
  muzzle.fillStyle(0xfff3b0, 0.95);
  muzzle.fillCircle(0, 0, 7);
  muzzle.setPosition(from.x, from.y);

  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: 1.8,
    duration: 120,
    ease: 'Quad.easeOut',
    onComplete: () => muzzle.destroy(),
  });

  const trail = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(trail);
  trail.lineStyle(2, TRACER_COLOR, 0.55);
  trail.lineBetween(from.x, from.y, to.x, to.y);

  scene.tweens.add({
    targets: trail,
    alpha: 0,
    duration: TRACER_MS,
    onComplete: () => trail.destroy(),
  });

  const tracer = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(tracer);
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
      playImpact(scene, to, onCreate);
      onImpact();
    },
  });
}

function playImpact(scene: Phaser.Scene, at: ShotPoint, onCreate?: CreateHook): void {
  const flash = scene.add.graphics().setDepth(FX_DEPTH);
  onCreate?.(flash);
  flash.fillStyle(FLASH_COLOR, 0.9);
  flash.fillCircle(0, 0, 9);
  flash.setPosition(at.x, at.y);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 2.2,
    duration: IMPACT_MS,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  for (let index = 0; index < SPARK_COUNT; index += 1) {
    const angle = (Math.PI * 2 * index) / SPARK_COUNT;
    const spark = scene.add.graphics().setDepth(FX_DEPTH);
    onCreate?.(spark);
    spark.fillStyle(0xffc06a, 0.9);
    spark.fillCircle(0, 0, 2.2);
    spark.setPosition(at.x, at.y);

    scene.tweens.add({
      targets: spark,
      x: at.x + Math.cos(angle) * SPARK_DISTANCE,
      y: at.y + Math.sin(angle) * SPARK_DISTANCE,
      alpha: 0,
      duration: IMPACT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}
