import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, SCENE_KEYS } from '../theme';
import { MenuButton } from '../ui/MenuButton';
import { closeGame, isDesktop } from '../windowBridge';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.mainMenu);
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.text(width / 2, height * 0.2, 'MY VERY ADVANCE WARS', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.text,
    }).setOrigin(0.5);

    new MenuButton(this, {
      x: width / 2,
      y: height * 0.55,
      width: 160,
      height: 36,
      label: 'GRA',
      onClick: () => this.scene.start(SCENE_KEYS.battlefield),
    });

    new MenuButton(this, {
      x: width / 2,
      y: height * 0.55 + 52,
      width: 160,
      height: 36,
      label: 'USTAWIENIA',
      onClick: () => this.scene.start(SCENE_KEYS.settings),
    });

    this.createCloseButton(width - 26, 26);
  }

  private createCloseButton(x: number, y: number): void {
    if (!isDesktop()) {
      return;
    }

    const cross = this.add.graphics({ x, y });
    this.drawCross(cross, 0xffffff);

    const hitArea = this.add.rectangle(x, y, 36, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => this.drawCross(cross, COLORS.windowRedHover));
    hitArea.on('pointerout', () => this.drawCross(cross, 0xffffff));
    hitArea.on('pointerup', () => closeGame());
  }

  private drawCross(cross: Phaser.GameObjects.Graphics, color: number): void {
    const arm = 8;
    cross.clear();
    cross.lineStyle(3, color, 1);
    cross.lineBetween(-arm, -arm, arm, arm);
    cross.lineBetween(arm, -arm, -arm, arm);
  }
}
