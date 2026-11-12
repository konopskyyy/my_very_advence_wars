import Phaser from 'phaser';
import { FACTION_THEMES } from './factionTheme';

export const MENU_BUTTON_WIDTH = 320;
export const MENU_BUTTON_HEIGHT = 48;

export interface MenuButton {
  readonly container: Phaser.GameObjects.Container;
}

export function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  accent: 'blue' | 'red' | 'neutral',
  onClick: () => void,
): MenuButton {
  const theme = FACTION_THEMES[accent];
  const w = MENU_BUTTON_WIDTH;
  const h = MENU_BUTTON_HEIGHT;

  const bg = scene.add.graphics();
  const draw = (hover: boolean): void => {
    bg.clear();
    bg.fillStyle(hover ? theme.accentDark : 0x111826, hover ? 0.95 : 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, hover ? theme.accentBright : theme.divider, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.fillStyle(theme.accent, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, 6, h, { tl: 6, bl: 6, tr: 0, br: 0 });
  };
  draw(false);

  const text = scene.add
    .text(0, 0, label.toUpperCase(), {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#e8eef5',
    })
    .setOrigin(0.5)
    .setLetterSpacing(3);

  const container = scene.add.container(x, y, [bg, text]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });

  container.on('pointerover', () => {
    draw(true);
    text.setColor('#ffffff');
    scene.tweens.add({ targets: container, x: x + 8, duration: 120, ease: 'Sine.easeOut' });
  });
  container.on('pointerout', () => {
    draw(false);
    text.setColor('#e8eef5');
    scene.tweens.add({ targets: container, x, duration: 120, ease: 'Sine.easeOut' });
  });
  container.on('pointerdown', onClick);

  container.setAlpha(0);
  container.x = x - 24;
  scene.tweens.add({
    targets: container,
    alpha: 1,
    x,
    duration: 350,
    delay: 120 + y * 0.4,
    ease: 'Cubic.easeOut',
  });

  return { container };
}
