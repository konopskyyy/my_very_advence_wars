import Phaser from 'phaser';
import type { TutorialHint } from '../core/tutorial';
import { playTipSound } from './combatAudio';
import { FACTION_THEMES } from './factionTheme';
import { BAR_WIDTH } from './hudLayout';

const WIDTH = 340;
const MARGIN = 20;
const PADDING = 16;
const DEPTH = 21;
const ICON_SIZE = 34;
const ICON_TOP = 96;
const ICON_INSET = 8;
const ICON_GAP = 6;
const ACCENT = FACTION_THEMES.blue.accent;
const BACKGROUND = FACTION_THEMES.blue.barBackground;
const TEXT_WIDTH = WIDTH - PADDING * 2;

type VisibleObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

export class TutorialTip {
  private readonly objects: VisibleObject[] = [];
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly badge: Phaser.GameObjects.Graphics;
  private readonly badgeLabel: Phaser.GameObjects.Text;
  private readonly collapse: Phaser.GameObjects.Graphics;
  private readonly collapseLabel: Phaser.GameObjects.Text;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly badgeHit = new Phaser.Geom.Circle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);
  private readonly collapseHit = new Phaser.Geom.Circle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);
  private active = false;
  private expanded = false;
  private currentHint?: TutorialHint;
  private iconX = 0;
  private iconY = ICON_TOP;
  private panelX = 0;
  private panelY = 0;
  private panelHeight = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);

    this.badge = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 2);
    this.badge.fillStyle(BACKGROUND, 0.96);
    this.badge.fillCircle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);
    this.badge.lineStyle(2, ACCENT, 0.95);
    this.badge.strokeCircle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);
    this.badge.lineStyle(1, ACCENT, 0.45);
    this.badge.strokeCircle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2 - 4);

    this.badgeLabel = scene.add
      .text(0, 0, 'i', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontStyle: 'italic bold',
        color: '#f2f5f7',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);

    this.collapse = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 2);
    this.collapse.fillStyle(BACKGROUND, 0.96);
    this.collapse.fillCircle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);
    this.collapse.lineStyle(1, ACCENT, 0.7);
    this.collapse.strokeCircle(ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE / 2);

    this.collapseLabel = scene.add
      .text(0, 0, '−', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f2f5f7',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);

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
    this.title.setWordWrapWidth(TEXT_WIDTH - ICON_SIZE * 2 - ICON_GAP - 8);

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

    this.objects.push(
      this.panel,
      this.badge,
      this.badgeLabel,
      this.collapse,
      this.collapseLabel,
      this.tag,
      this.title,
      this.body,
    );

    this.badge.setInteractive(this.badgeHit, Phaser.Geom.Circle.Contains);
    this.badge.on('pointerdown', () => this.setExpanded(true));
    this.collapse.setInteractive(this.collapseHit, Phaser.Geom.Circle.Contains);
    this.collapse.on('pointerdown', () => this.setExpanded(false));

    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  show(hint: TutorialHint): void {
    const isNew = hint !== this.currentHint;
    this.currentHint = hint;
    this.active = true;

    this.tag.setText('SAMOUCZEK');
    this.title.setText(hint.title);
    this.body.setText(hint.text);
    this.layout();
    this.render();

    if (isNew) {
      playTipSound();
    }
  }

  hide(): void {
    this.active = false;
    this.expanded = false;
    this.render();
  }

  contains(x: number, y: number): boolean {
    if (!this.active) {
      return false;
    }

    if (this.expanded) {
      return (
        x >= this.panelX &&
        x <= this.panelX + WIDTH &&
        y >= this.panelY &&
        y <= this.panelY + this.panelHeight
      );
    }

    return Phaser.Geom.Circle.Contains(this.badgeHit, x - this.iconX, y - this.iconY);
  }

  private setExpanded(expanded: boolean): void {
    if (!this.active || this.expanded === expanded) {
      return;
    }

    this.expanded = expanded;
    this.render();
  }

  private layout(): void {
    const right = this.scene.scale.width - BAR_WIDTH - MARGIN;

    this.panelX = right - WIDTH;
    this.panelY = ICON_TOP - ICON_INSET;
    this.iconX = right - ICON_INSET - ICON_SIZE;
    this.iconY = ICON_TOP;

    const collapseX = this.iconX - ICON_GAP - ICON_SIZE;

    this.badge.setPosition(this.iconX, this.iconY);
    this.badgeLabel.setPosition(this.iconX + ICON_SIZE / 2, this.iconY + ICON_SIZE / 2);
    this.collapse.setPosition(collapseX, this.iconY);
    this.collapseLabel.setPosition(collapseX + ICON_SIZE / 2, this.iconY + ICON_SIZE / 2);

    this.panelHeight =
      PADDING + this.tag.height + 4 + this.title.height + 8 + this.body.height + PADDING;
    this.tag.setPosition(this.panelX + PADDING, this.panelY + PADDING);
    this.title.setPosition(this.panelX + PADDING, this.panelY + PADDING + this.tag.height + 4);
    this.body.setPosition(
      this.panelX + PADDING,
      this.panelY + PADDING + this.tag.height + 4 + this.title.height + 8,
    );

    this.drawPanel();
  }

  private drawPanel(): void {
    this.panel.clear();
    this.panel.fillStyle(BACKGROUND, 0.94);
    this.panel.fillRoundedRect(this.panelX, this.panelY, WIDTH, this.panelHeight, 10);
    this.panel.fillStyle(ACCENT, 1);
    this.panel.fillRect(this.panelX, this.panelY + 10, 3, this.panelHeight - 20);
    this.panel.lineStyle(1, ACCENT, 0.7);
    this.panel.strokeRoundedRect(this.panelX, this.panelY, WIDTH, this.panelHeight, 10);
    this.panel.fillStyle(BACKGROUND, 0.94);
    this.panel.fillTriangle(
      this.panelX + 24,
      this.panelY + this.panelHeight,
      this.panelX + 46,
      this.panelY + this.panelHeight,
      this.panelX + 30,
      this.panelY + this.panelHeight + 12,
    );
  }

  private render(): void {
    const showPanel = this.active && this.expanded;

    this.badge.setVisible(this.active);
    this.badgeLabel.setVisible(this.active);
    this.panel.setVisible(showPanel);
    this.tag.setVisible(showPanel);
    this.title.setVisible(showPanel);
    this.body.setVisible(showPanel);
    this.collapse.setVisible(showPanel);
    this.collapseLabel.setVisible(showPanel);

    if (this.badge.input) {
      this.badge.input.enabled = this.active;
    }

    if (this.collapse.input) {
      this.collapse.input.enabled = showPanel;
    }
  }
}
