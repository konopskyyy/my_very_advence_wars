import Phaser from 'phaser';
import { CampaignMenuScene } from './scenes/CampaignMenuScene';
import { MapEditorScene } from './scenes/MapEditorScene';
import { MapMenuScene } from './scenes/MapMenuScene';
import { MenuScene } from './scenes/MenuScene';
import { ScenarioMenuScene } from './scenes/ScenarioMenuScene';
import { ScenarioScene } from './scenes/ScenarioScene';
import { preloadCombatAudio } from './view/combatAudio';
import './style.css';

const game = new Phaser.Game({
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
  scene: [
    MenuScene,
    CampaignMenuScene,
    ScenarioMenuScene,
    ScenarioScene,
    MapMenuScene,
    MapEditorScene,
  ],
});

preloadCombatAudio();

(globalThis as { __mvawGame?: Phaser.Game }).__mvawGame = game;
