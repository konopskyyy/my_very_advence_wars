import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../theme';

export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
}

export class MenuButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);

    const background = scene.add.rectangle(0, 0, config.width, config.height, COLORS.panel)
      .setStrokeStyle(2, COLORS.border);
    const label = scene.add.text(0, 0, config.label, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: COLORS.text,
    }).setOrigin(0.5);

    this.add([background, label]);
    this.setSize(config.width, config.height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => background.setFillStyle(COLORS.panelHover));
    this.on('pointerout', () => background.setFillStyle(COLORS.panel));
    this.on('pointerdown', () => background.setFillStyle(COLORS.panelPressed));
    this.on('pointerup', () => {
      background.setFillStyle(COLORS.panelHover);
      config.onClick();
    });

    scene.add.existing(this);
  }
}
