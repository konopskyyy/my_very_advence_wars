import Phaser from 'phaser';
import type { TurnLog } from '../core/plan';
import { formatTurnLog } from '../core/plan';
import { FACTION_THEMES } from './factionTheme';

const DEPTH = 70;
const PANEL_WIDTH = 720;
const PANEL_HEIGHT = 500;
const CONTENT_TOP = 92;
const CONTENT_BOTTOM = 84;
const BUTTON_HEIGHT = 40;
const BUTTON_WIDTH = 220;
const SCROLLBAR_WIDTH = 6;

export interface TurnLogPanelHandlers {
  readonly onReplay: () => void;
  readonly onClose: () => void;
}

interface PanelButton {
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class TurnLogPanel {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly content: Phaser.GameObjects.Text;
  private readonly scrollbar: Phaser.GameObjects.Graphics;
  private readonly replayButton: PanelButton;
  private readonly closeButton: PanelButton;
  private readonly mask: Phaser.Display.Masks.GeometryMask;
  private scroll = 0;
  private open = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: TurnLogPanelHandlers,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const contentX = left + 24;
    const contentY = top + CONTENT_TOP;
    const contentWidth = PANEL_WIDTH - 48 - SCROLLBAR_WIDTH;
    const contentHeight = PANEL_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM;

    this.backdrop = scene.add
      .rectangle(0, 0, width, height, 0x05080c, 0.62)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    this.backdrop.on('pointerdown', () => this.handlers.onClose());

    this.panel = scene.add
      .rectangle(left, top, PANEL_WIDTH, PANEL_HEIGHT, FACTION_THEMES.blue.barBackground, 0.98)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 1)
      .setInteractive();

    this.title = scene.add
      .text(left + PANEL_WIDTH / 2, top + 18, 'DZIENNIK TUR', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: FACTION_THEMES.blue.accentSoft,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.subtitle = scene.add
      .text(left + PANEL_WIDTH / 2, top + 44, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(contentX, contentY, contentWidth, contentHeight);
    this.mask = maskShape.createGeometryMask();

    this.content = scene.add
      .text(contentX, contentY, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
        lineSpacing: 4,
        wordWrap: { width: contentWidth },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 3)
      .setMask(this.mask);

    this.scrollbar = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 3);

    const buttonY = top + PANEL_HEIGHT - BUTTON_HEIGHT - 24;
    const gap = 16;
    const groupWidth = BUTTON_WIDTH * 2 + gap;
    const groupLeft = left + (PANEL_WIDTH - groupWidth) / 2;

    this.replayButton = this.makeButton(
      'ODTWÓRZ OD POCZĄTKU',
      groupLeft,
      buttonY,
      BUTTON_WIDTH,
      this.handlers.onReplay,
    );
    this.closeButton = this.makeButton(
      'ZAMKNIJ',
      groupLeft + BUTTON_WIDTH + gap,
      buttonY,
      BUTTON_WIDTH,
      this.handlers.onClose,
    );

    this.objects.push(
      this.backdrop,
      this.panel,
      this.title,
      this.subtitle,
      this.content,
      this.scrollbar,
      this.replayButton.box,
      this.replayButton.label,
      this.closeButton.box,
      this.closeButton.label,
    );

    scene.input.on('wheel', this.onWheel, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('wheel', this.onWheel, this);
      this.mask.destroy();
    });

    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(logs: readonly TurnLog[], replayAvailable: boolean): void {
    this.open = true;
    this.scroll = 0;

    const body =
      logs.length > 0
        ? logs.flatMap((log) => formatTurnLog(log)).join('\n')
        : 'Brak zapisanych tur.\nWykonaj turę, aby zobaczyć dziennik i odtworzyć rozgrywkę.';

    this.content.setText(body).setY(this.contentY());
    this.subtitle.setText(
      logs.length > 0
        ? `${logs.length} ${logs.length === 1 ? 'tura' : 'tur'} w zapisie`
        : 'Dziennik jest pusty',
    );
    this.replayButton.box.setAlpha(replayAvailable ? 1 : 0.45);
    this.replayButton.label.setAlpha(replayAvailable ? 1 : 0.45);
    this.setVisible(true);
    this.drawScrollbar();
  }

  hide(): void {
    this.open = false;
    this.setVisible(false);
  }

  private get contentArea() {
    const left = Math.round((this.scene.scale.width - PANEL_WIDTH) / 2);
    const top = Math.round((this.scene.scale.height - PANEL_HEIGHT) / 2);

    return {
      x: left + 24,
      y: top + CONTENT_TOP,
      width: PANEL_WIDTH - 48 - SCROLLBAR_WIDTH,
      height: PANEL_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM,
      right: left + PANEL_WIDTH - 24,
    };
  }

  private contentY(): number {
    return this.contentArea.y - this.scroll;
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.open) {
      return;
    }

    const area = this.contentArea;

    if (
      pointer.x < area.x ||
      pointer.x > area.x + area.width ||
      pointer.y < area.y ||
      pointer.y > area.y + area.height
    ) {
      return;
    }

    const maxScroll = Math.max(0, this.content.height - area.height);

    this.scroll = Phaser.Math.Clamp(this.scroll + (deltaY > 0 ? 48 : -48), 0, maxScroll);
    this.content.setY(this.contentY());
    this.drawScrollbar();
  }

  private drawScrollbar(): void {
    const area = this.contentArea;
    const maxScroll = Math.max(0, this.content.height - area.height);

    this.scrollbar.clear();

    if (maxScroll <= 0) {
      return;
    }

    const trackX = area.right + 6;
    const thumbHeight = Math.max(32, (area.height / this.content.height) * area.height);
    const thumbY = area.y + (this.scroll / maxScroll) * (area.height - thumbHeight);

    this.scrollbar.fillStyle(0x1d3350, 1);
    this.scrollbar.fillRect(trackX, area.y, 4, area.height);
    this.scrollbar.fillStyle(FACTION_THEMES.blue.accentBright, 0.9);
    this.scrollbar.fillRect(trackX, thumbY, 4, thumbHeight);
  }

  private makeButton(
    text: string,
    x: number,
    y: number,
    width: number,
    handler: () => void,
  ): PanelButton {
    const box = this.scene.add
      .rectangle(x, y, width, BUTTON_HEIGHT, 0x142033, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 0.9)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(x + width / 2, y + BUTTON_HEIGHT / 2, text, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);

    box.on('pointerover', () => {
      box.setFillStyle(0x1d3350, 1);
      label.setColor('#a6f4c5');
    });
    box.on('pointerout', () => {
      box.setFillStyle(0x142033, 1);
      label.setColor('#ffffff');
    });
    box.on('pointerdown', () => {
      if (box.alpha >= 1) {
        handler();
      }
    });

    return { box, label };
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }
}
