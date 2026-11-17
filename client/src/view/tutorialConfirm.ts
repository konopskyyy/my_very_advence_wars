import type Phaser from 'phaser';
import type { TutorialHint } from '../core/tutorial';
import { FACTION_THEMES } from './factionTheme';

const DEPTH = 74;
const PANEL_WIDTH = 480;
const PANEL_HEIGHT = 260;
const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 44;

export interface TutorialConfirmHandlers {
  readonly onConfirm: () => void;
}

export class TutorialConfirm {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly button: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private open = false;

  constructor(
    scene: Phaser.Scene,
    handlers: TutorialConfirmHandlers,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const contentWidth = PANEL_WIDTH - 64;

    this.backdrop = scene.add
      .rectangle(0, 0, width, height, 0x05080c, 0.72)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive();
    this.panel = scene.add
      .rectangle(left, top, PANEL_WIDTH, PANEL_HEIGHT, FACTION_THEMES.blue.barBackground, 0.98)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 1)
      .setInteractive();

    this.tag = scene.add
      .text(left + PANEL_WIDTH / 2, top + 20, 'SAMOUCZEK', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: FACTION_THEMES.blue.accentSoft,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.title = scene.add
      .text(left + PANEL_WIDTH / 2, top + 46, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f2f5f7',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.body = scene.add
      .text(left + 32, top + 96, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#d8e2dc',
        lineSpacing: 6,
        wordWrap: { width: contentWidth },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    const buttonX = left + (PANEL_WIDTH - BUTTON_WIDTH) / 2;
    const buttonY = top + PANEL_HEIGHT - BUTTON_HEIGHT - 24;

    this.button = scene.add
      .rectangle(buttonX, buttonY, BUTTON_WIDTH, BUTTON_HEIGHT, 0x142033, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 0.9)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(buttonX + BUTTON_WIDTH / 2, buttonY + BUTTON_HEIGHT / 2, 'ROZUMIEM', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);

    this.button.on('pointerover', () => {
      this.button.setFillStyle(0x1d3350, 1);
      this.label.setColor('#a6f4c5');
    });
    this.button.on('pointerout', () => {
      this.button.setFillStyle(0x142033, 1);
      this.label.setColor('#ffffff');
    });
    this.button.on('pointerdown', handlers.onConfirm);

    this.objects.push(
      this.backdrop,
      this.panel,
      this.tag,
      this.title,
      this.body,
      this.button,
      this.label,
    );
    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(hint: TutorialHint): void {
    this.title.setText(hint.title);
    this.body.setText(hint.text);
    this.open = true;
    this.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.setVisible(false);
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }
}
