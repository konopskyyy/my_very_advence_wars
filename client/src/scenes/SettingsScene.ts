import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, SCENE_KEYS } from '../theme';
import { MenuButton } from '../ui/MenuButton';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.settings);
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.text(width / 2, height * 0.3, 'USTAWIENIA', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: COLORS.text,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, 'Wkrótce: dźwięk, rozdzielczość, sterowanie.', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: COLORS.text,
    }).setOrigin(0.5);

    new MenuButton(this, {
      x: width / 2,
      y: height * 0.7,
      width: 160,
      height: 36,
      label: 'POWRÓT',
      onClick: () => this.scene.start(SCENE_KEYS.mainMenu),
    });
  }
}
