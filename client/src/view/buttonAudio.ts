import Phaser from 'phaser';
import { playClickSound } from './combatAudio';

export function installButtonClickSound(scene: Phaser.Scene): void {
  scene.input.on(
    Phaser.Input.Events.GAMEOBJECT_DOWN,
    (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject.input?.cursor === 'pointer') {
        playClickSound();
      }
    },
  );
}
