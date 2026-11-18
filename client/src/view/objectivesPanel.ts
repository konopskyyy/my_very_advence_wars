import Phaser from 'phaser';
import { FACTION_THEMES } from './factionTheme';

const DEPTH = 72;
const PANEL_WIDTH = 680;
const PANEL_HEIGHT = 460;
const BUTTON_HEIGHT = 40;
const BUTTON_WIDTH = 200;
const CONTENT_TOP = 72;
const CONTENT_BOTTOM_GAP = 12;
const SCROLLBAR_WIDTH = 6;
const SCROLLBAR_MIN_THUMB = 32;
const WHEEL_STEP = 48;

export interface ObjectivesPanelState {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly { readonly reached: boolean; readonly hint: { readonly title: string; readonly text: string } }[];
}

export interface ObjectivesPanelHandlers {
  readonly onClose: () => void;
}

export class ObjectivesPanel {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly content: Phaser.GameObjects.Container;
  private readonly description: Phaser.GameObjects.Text;
  private readonly stepsTitle: Phaser.GameObjects.Text;
  private readonly steps: Phaser.GameObjects.Text;
  private readonly scrollbar: Phaser.GameObjects.Graphics;
  private readonly mask: Phaser.Display.Masks.GeometryMask;
  private readonly closeButton: Phaser.GameObjects.Rectangle;
  private readonly closeLabel: Phaser.GameObjects.Text;
  private scroll = 0;
  private open = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: ObjectivesPanelHandlers,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const contentX = left + 32;
    const contentWidth = PANEL_WIDTH - 64 - SCROLLBAR_WIDTH;
    const contentTop = top + CONTENT_TOP;
    const buttonY = top + PANEL_HEIGHT - BUTTON_HEIGHT - 22;
    const contentHeight = buttonY - CONTENT_BOTTOM_GAP - contentTop;

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
      .text(left + PANEL_WIDTH / 2, top + 18, 'CELE MISJI', {
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
        fontSize: '13px',
        color: '#f2f5f7',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(contentX, contentTop, contentWidth, contentHeight);
    this.mask = maskShape.createGeometryMask();

    this.description = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d8e2dc',
      lineSpacing: 3,
      wordWrap: { width: contentWidth },
    });

    this.stepsTitle = scene.add.text(0, 0, 'KROKI', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: FACTION_THEMES.blue.accentSoft,
    });

    this.steps = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d8e2dc',
      lineSpacing: 5,
      wordWrap: { width: contentWidth },
    });

    this.content = scene.add
      .container(contentX, contentTop)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setMask(this.mask);
    this.content.add([this.description, this.stepsTitle, this.steps]);

    this.scrollbar = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 2);

    const buttonX = left + (PANEL_WIDTH - BUTTON_WIDTH) / 2;

    this.closeButton = scene.add
      .rectangle(buttonX, buttonY, BUTTON_WIDTH, BUTTON_HEIGHT, 0x142033, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 0.9)
      .setInteractive({ useHandCursor: true });

    this.closeLabel = scene.add
      .text(buttonX + BUTTON_WIDTH / 2, buttonY + BUTTON_HEIGHT / 2, 'ZAMKNIJ', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 3);

    this.closeButton.on('pointerover', () => {
      this.closeButton.setFillStyle(0x1d3350, 1);
      this.closeLabel.setColor('#a6f4c5');
    });
    this.closeButton.on('pointerout', () => {
      this.closeButton.setFillStyle(0x142033, 1);
      this.closeLabel.setColor('#ffffff');
    });
    this.closeButton.on('pointerdown', () => this.handlers.onClose());

    this.objects.push(
      this.backdrop,
      this.panel,
      this.title,
      this.subtitle,
      this.content,
      this.scrollbar,
      this.closeButton,
      this.closeLabel,
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

  show(state: ObjectivesPanelState): void {
    this.open = true;
    this.scroll = 0;
    this.subtitle.setText(state.name);
    this.description.setText(state.description);

    if (state.steps.length === 0) {
      this.stepsTitle.setVisible(false);
      this.steps.setY(this.description.height + 12);
      this.steps.setText('Zniszcz wszystkie jednostki wroga, aby ukończyć misję.');
    } else {
      this.stepsTitle.setVisible(true).setY(this.description.height + 16);
      this.steps.setY(this.stepsTitle.y + 20);
      this.steps.setText(
        state.steps
          .map(
            (step) =>
              `${step.reached ? '[x]' : '[ ]'} ${step.hint.title}\n    ${step.hint.text}`,
          )
          .join('\n'),
      );
    }

    this.setVisible(true);
    this.refresh();
  }

  hide(): void {
    this.open = false;
    this.setVisible(false);
  }

  private get contentArea() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const contentTop = top + CONTENT_TOP;
    const buttonY = top + PANEL_HEIGHT - BUTTON_HEIGHT - 22;

    return {
      x: left + 32,
      y: contentTop,
      width: PANEL_WIDTH - 64 - SCROLLBAR_WIDTH,
      height: buttonY - CONTENT_BOTTOM_GAP - contentTop,
      right: left + PANEL_WIDTH - 24,
    };
  }

  private get contentBottom(): number {
    return this.steps.y + this.steps.height;
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

    const maxScroll = Math.max(0, this.contentBottom - area.height);

    if (maxScroll <= 0) {
      return;
    }

    this.scroll = Phaser.Math.Clamp(this.scroll + (deltaY > 0 ? WHEEL_STEP : -WHEEL_STEP), 0, maxScroll);
    this.refresh();
  }

  private refresh(): void {
    const area = this.contentArea;
    const maxScroll = Math.max(0, this.contentBottom - area.height);

    this.scroll = Phaser.Math.Clamp(this.scroll, 0, maxScroll);
    this.content.setY(area.y - this.scroll);
    this.drawScrollbar(maxScroll);
  }

  private drawScrollbar(maxScroll: number): void {
    const area = this.contentArea;

    this.scrollbar.clear();

    if (maxScroll <= 0) {
      return;
    }

    const trackX = area.right + 6;
    const thumbHeight = Math.max(SCROLLBAR_MIN_THUMB, (area.height / this.contentBottom) * area.height);
    const thumbY = area.y + (this.scroll / maxScroll) * (area.height - thumbHeight);

    this.scrollbar.fillStyle(0x1d3350, 1);
    this.scrollbar.fillRect(trackX, area.y, 4, area.height);
    this.scrollbar.fillStyle(FACTION_THEMES.blue.accentBright, 0.9);
    this.scrollbar.fillRect(trackX, thumbY, 4, thumbHeight);
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }
}
