import Phaser from 'phaser';
import { MapEditorScene } from './scenes/MapEditorScene';
import { MapMenuScene } from './scenes/MapMenuScene';
import { MenuScene } from './scenes/MenuScene';
import { ScenarioMenuScene } from './scenes/ScenarioMenuScene';
import { ScenarioScene } from './scenes/ScenarioScene';
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
    width: 1280,
    height: 720,
  },
  disableContextMenu: true,
  scene: [MenuScene, ScenarioMenuScene, ScenarioScene, MapMenuScene, MapEditorScene],
});
