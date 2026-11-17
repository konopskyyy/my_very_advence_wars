import type Phaser from 'phaser';
import { FACTION_THEMES } from './factionTheme';

const DEPTH = 72;
const PANEL_WIDTH = 680;
const PANEL_HEIGHT = 460;
const BUTTON_HEIGHT = 40;
const BUTTON_WIDTH = 200;

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
  private readonly description: Phaser.GameObjects.Text;
  private readonly stepsTitle: Phaser.GameObjects.Text;
  private readonly steps: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Rectangle;
  private readonly closeLabel: Phaser.GameObjects.Text;
  private open = false;

  constructor(
    scene: Phaser.Scene,
    private readonly handlers: ObjectivesPanelHandlers,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const contentWidth = PANEL_WIDTH - 64;

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

    this.description = scene.add
      .text(left + 32, top + 72, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
        lineSpacing: 3,
        wordWrap: { width: contentWidth },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.stepsTitle = scene.add
      .text(left + 32, top + 132, 'KROKI', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: FACTION_THEMES.blue.accentSoft,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.steps = scene.add
      .text(left + 32, top + 152, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
        lineSpacing: 5,
        wordWrap: { width: contentWidth },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    const buttonX = left + (PANEL_WIDTH - BUTTON_WIDTH) / 2;
    const buttonY = top + PANEL_HEIGHT - BUTTON_HEIGHT - 22;

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
      this.description,
      this.stepsTitle,
      this.steps,
      this.closeButton,
      this.closeLabel,
    );

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
    this.subtitle.setText(state.name);
    this.description.setText(state.description);

    if (state.steps.length === 0) {
      this.steps.setText('Zniszcz wszystkie jednostki wroga, aby ukończyć misję.');
    } else {
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
    this.stepsTitle.setVisible(state.steps.length > 0);
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
