import Phaser from 'phaser';
import { MapEditorScene } from './scenes/MapEditorScene';
import { MapMenuScene } from './scenes/MapMenuScene';
import { MenuScene } from './scenes/MenuScene';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0b0b',
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 480,
  },
  disableContextMenu: true,
  scene: [MenuScene, MapMenuScene, MapEditorScene],
});
