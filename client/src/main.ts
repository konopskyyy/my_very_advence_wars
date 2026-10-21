import Phaser from 'phaser';
import { COLORS, SCENE_KEYS } from './theme';
import { BattlefieldScene } from './scenes/BattlefieldScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SettingsScene } from './scenes/SettingsScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 270,
  },
  scene: [MainMenuScene, BattlefieldScene, SettingsScene],
  callbacks: {
    postBoot: (game) => {
      game.scene.start(SCENE_KEYS.mainMenu);
    },
  },
});
