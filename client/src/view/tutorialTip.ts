import Phaser from 'phaser';
import type { TutorialHint } from '../core/tutorial';
import { FACTION_THEMES } from './factionTheme';

const WIDTH = 340;
const MARGIN = 20;
const PADDING = 16;
const DEPTH = 21;
const ACCENT = FACTION_THEMES.blue.accent;
const TEXT_WIDTH = WIDTH - PADDING * 2;

export class TutorialTip {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.tag = scene.add
      .text(0, 0, 'SAMOUCZEK', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: FACTION_THEMES.blue.accentSoft,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.title = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f2f5f7',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.body = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
        wordWrap: { width: TEXT_WIDTH },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.objects.push(this.panel, this.tag, this.title, this.body);
    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  show(hint: TutorialHint): void {
    this.tag.setText('SAMOUCZEK');
    this.title.setText(hint.title);
    this.body.setText(hint.text);

    const x = this.scene.scale.width - MARGIN - WIDTH;
    const y = 96;
    const height = PADDING + this.tag.height + 4 + this.title.height + 8 + this.body.height + PADDING;

    this.tag.setPosition(x + PADDING, y + PADDING);
    this.title.setPosition(x + PADDING, y + PADDING + this.tag.height + 4);
    this.body.setPosition(
      x + PADDING,
      y + PADDING + this.tag.height + 4 + this.title.height + 8,
    );

    this.panel.clear();
    this.panel.fillStyle(FACTION_THEMES.blue.barBackground, 0.94);
    this.panel.fillRoundedRect(x, y, WIDTH, height, 10);
    this.panel.fillStyle(ACCENT, 1);
    this.panel.fillRect(x, y + 10, 3, height - 20);
    this.panel.lineStyle(1, ACCENT, 0.7);
    this.panel.strokeRoundedRect(x, y, WIDTH, height, 10);
    this.panel.fillStyle(FACTION_THEMES.blue.barBackground, 0.94);
    this.panel.fillTriangle(
      x + 24,
      y + height,
      x + 46,
      y + height,
      x + 30,
      y + height + 12,
    );

    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }
}
