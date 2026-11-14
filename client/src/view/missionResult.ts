import Phaser from 'phaser';
import { FACTION_THEMES } from './factionTheme';

const DEPTH = 60;
const PANEL_WIDTH = 460;
const PANEL_HEIGHT = 326;
const BUTTON_WIDTH = 194;
const BUTTON_HEIGHT = 46;
const WIDE_BUTTON_WIDTH = 396;

export interface MissionResultHandlers {
  readonly onReturn: () => void;
  readonly onMainMenu: () => void;
  readonly onReplay: () => void;
}

interface ResultButton {
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class MissionResult {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly mission: Phaser.GameObjects.Text;
  private readonly damage: Phaser.GameObjects.Text;
  private readonly note: Phaser.GameObjects.Text;
  private readonly replayButton: ResultButton;
  private readonly returnButton: ResultButton;
  private readonly mainMenuButton: ResultButton;

  constructor(
    private readonly scene: Phaser.Scene,
    handlers: MissionResultHandlers,
  ) {
    this.backdrop = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1);

    this.tag = scene.add
      .text(0, 0, 'WYNIK MISJI', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: FACTION_THEMES.blue.accentSoft,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.title = scene.add
      .text(0, 0, 'MISJA UKOŃCZONA', {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f2f5f7',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.mission = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8e2dc',
        align: 'center',
        wordWrap: { width: PANEL_WIDTH - 64 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.note = scene.add
      .text(0, 0, 'Wróg pokonany — możesz wrócić do menu.', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.damage = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f2d35c',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2);

    this.replayButton = this.makeButton('OBEJRZYJ REPLAY', handlers.onReplay);
    this.returnButton = this.makeButton('WRÓĆ', handlers.onReturn);
    this.mainMenuButton = this.makeButton('MENU GŁÓWNE', handlers.onMainMenu);

    this.objects.push(
      this.backdrop,
      this.panel,
      this.tag,
      this.title,
      this.mission,
      this.damage,
      this.note,
      this.replayButton.box,
      this.replayButton.label,
      this.returnButton.box,
      this.returnButton.label,
      this.mainMenuButton.box,
      this.mainMenuButton.label,
    );
    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  show(missionName: string, returnLabel: string, damage: number, replayAvailable: boolean): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const left = Math.round((width - PANEL_WIDTH) / 2);
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const centerX = width / 2;

    this.backdrop.clear();
    this.backdrop.fillStyle(0x05080c, 0.78);
    this.backdrop.fillRect(0, 0, width, height);

    this.panel.clear();
    this.panel.fillStyle(FACTION_THEMES.blue.barBackground, 0.97);
    this.panel.fillRoundedRect(left, top, PANEL_WIDTH, PANEL_HEIGHT, 14);
    this.panel.fillStyle(FACTION_THEMES.blue.accent, 1);
    this.panel.fillRect(left, top + 16, 4, PANEL_HEIGHT - 32);
    this.panel.lineStyle(1, FACTION_THEMES.blue.accent, 0.8);
    this.panel.strokeRoundedRect(left, top, PANEL_WIDTH, PANEL_HEIGHT, 14);

    this.tag.setPosition(centerX, top + 28);
    this.title.setPosition(centerX, top + 52);
    this.mission.setText(missionName).setPosition(centerX, top + 98);
    this.damage.setText(`Zadane obrażenia: ${damage}`).setPosition(centerX, top + 132);
    this.note.setPosition(centerX, top + 162);
    this.returnButton.label.setText(returnLabel);

    const replayY = top + 194;

    this.replayButton.box.setPosition(centerX - WIDE_BUTTON_WIDTH / 2, replayY);
    this.replayButton.box.setSize(WIDE_BUTTON_WIDTH, BUTTON_HEIGHT);
    this.replayButton.label.setPosition(centerX, replayY + BUTTON_HEIGHT / 2);

    const buttonY = top + 252;
    const buttonLeft = centerX - BUTTON_WIDTH - 8;

    this.returnButton.box.setPosition(buttonLeft, buttonY);
    this.returnButton.label.setPosition(buttonLeft + BUTTON_WIDTH / 2, buttonY + BUTTON_HEIGHT / 2);
    this.mainMenuButton.box.setPosition(centerX + 8, buttonY);
    this.mainMenuButton.label.setPosition(
      centerX + 8 + BUTTON_WIDTH / 2,
      buttonY + BUTTON_HEIGHT / 2,
    );

    this.setVisible(true);
    this.replayButton.box.setVisible(replayAvailable);
    this.replayButton.label.setVisible(replayAvailable);
  }

  hide(): void {
    this.setVisible(false);
  }

  private makeButton(text: string, handler: () => void): ResultButton {
    const box = this.scene.add
      .rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 0x142033, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, FACTION_THEMES.blue.accent, 0.9)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '14px',
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
    box.on('pointerdown', handler);

    return { box, label };
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }
}
