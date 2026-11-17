import Phaser from 'phaser';
import bomberUrl from '../assets/craft/bomber.svg?url';

export const AIRSTRIKE_CRAFT_KEY = 'airstrike-bomber';

const FX_DEPTH = 8;
const FLY_MS = 700;
const BOMB_DROP_AT = 0.5;
const BOMB_MS = FLY_MS * (1 - BOMB_DROP_AT);
const CRAFT_WIDTH = 72;
const CRAFT_HEIGHT = 36;
const BLAST_MS = 420;
const BLAST_COLOR = 0xff8c42;
const CORE_COLOR = 0xfff3b0;

type CreateHook = (object: Phaser.GameObjects.GameObject) => void;

export interface AirstrikePoint {
  readonly x: number;
  readonly y: number;
}

export function preloadAirstrikeCraft(scene: Phaser.Scene): void {
  if (!scene.textures.exists(AIRSTRIKE_CRAFT_KEY)) {
    scene.load.image(AIRSTRIKE_CRAFT_KEY, bomberUrl);
  }
}

export function playAirstrikeEffect(
  scene: Phaser.Scene,
  from: AirstrikePoint,
  to: AirstrikePoint,
  onImpact: () => void,
  onCreate?: CreateHook,
): void {
  const craft = scene.add
    .image(from.x, from.y, AIRSTRIKE_CRAFT_KEY)
    .setDepth(FX_DEPTH)
    .setDisplaySize(CRAFT_WIDTH, CRAFT_HEIGHT);
  onCreate?.(craft);

  let bombDropped = false;
  scene.tweens.add({
    targets: craft,
    x: to.x,
    y: to.y,
    duration: FLY_MS,
    ease: 'Sine.easeInOut',
    onUpdate: (tween) => {
      if (bombDropped || tween.progress < BOMB_DROP_AT) {
        return;
      }

      bombDropped = true;
      playBomb(scene, { x: craft.x, y: craft.y }, to, onCreate);
    },
    onComplete: () => {
      craft.destroy();
      playBlast(scene, to, onCreate);
      onImpact();
    },
  });
}

function playBomb(
  scene: Phaser.Scene,
  from: AirstrikePoint,
  to: AirstrikePoint,
  onCreate?: CreateHook,
): void {
  const bomb = scene.add.graphics().setDepth(FX_DEPTH + 1);
  onCreate?.(bomb);
  bomb.fillStyle(0x20262c, 1);
  bomb.fillCircle(0, 0, 5);
  bomb.fillStyle(BLAST_COLOR, 0.9);
  bomb.fillCircle(0, -3, 2);
  bomb.setPosition(from.x, from.y);

  scene.tweens.add({
    targets: bomb,
    x: to.x,
    y: to.y,
    duration: BOMB_MS,
    ease: 'Quad.easeIn',
    onComplete: () => bomb.destroy(),
  });
}

function playBlast(scene: Phaser.Scene, at: AirstrikePoint, onCreate?: CreateHook): void {
  const ring = scene.add.graphics().setDepth(FX_DEPTH + 1);
  onCreate?.(ring);
  ring.lineStyle(4, BLAST_COLOR, 0.95);
  ring.strokeCircle(0, 0, 14);
  ring.setPosition(at.x, at.y);
  scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 3.6,
    duration: BLAST_MS,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  const flash = scene.add.graphics().setDepth(FX_DEPTH + 1);
  onCreate?.(flash);
  flash.fillStyle(BLAST_COLOR, 0.9);
  flash.fillCircle(0, 0, 20);
  flash.fillStyle(CORE_COLOR, 0.95);
  flash.fillCircle(0, 0, 9);
  flash.setPosition(at.x, at.y);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 3,
    duration: BLAST_MS,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    const spark = scene.add.graphics().setDepth(FX_DEPTH + 1);
    onCreate?.(spark);
    spark.fillStyle(index % 2 === 0 ? CORE_COLOR : BLAST_COLOR, 0.9);
    spark.fillCircle(0, 0, index % 2 === 0 ? 4 : 3);
    spark.setPosition(at.x, at.y);
    scene.tweens.add({
      targets: spark,
      x: at.x + Math.cos(angle) * 46,
      y: at.y + Math.sin(angle) * 46,
      alpha: 0,
      duration: BLAST_MS,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}
