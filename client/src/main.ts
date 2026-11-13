import Phaser from 'phaser';
import { CampaignMenuScene } from './scenes/CampaignMenuScene';
import { MapEditorScene } from './scenes/MapEditorScene';
import { MapMenuScene } from './scenes/MapMenuScene';
import { MenuScene } from './scenes/MenuScene';
import { ScenarioMenuScene } from './scenes/ScenarioMenuScene';
import { ScenarioScene } from './scenes/ScenarioScene';
import { mountAccountOverlay } from './view/accountOverlay';
import { mountAuthScreen } from './view/authScreen';
import { preloadCombatAudio } from './view/combatAudio';
import { isGameEntry } from './view/gameEntry';

let game: Phaser.Game | undefined;

function revealGame(): void {
  const authScreen = document.getElementById('auth-screen');
  const app = document.getElementById('app');

  if (authScreen) {
    authScreen.hidden = true;
  }

  if (app) {
    app.hidden = false;
  }
}

function startGame(): void {
  if (game) {
    return;
  }

  revealGame();
  mountAccountOverlay();

  game = new Phaser.Game({
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

  (globalThis as { __mvawGame?: Phaser.Game }).__mvawGame = game;
}

if (isGameEntry(window.location.pathname, window.location.search)) {
  startGame();
} else {
  mountAuthScreen({
    onEnterGame: () => {
      window.location.assign('/game');
    },
  });
}

preloadCombatAudio();
