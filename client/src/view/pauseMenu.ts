import Phaser from 'phaser';
import { isSoundEnabled, setSoundEnabled } from './combatAudio';

const DEPTH = 90;
const PANEL_WIDTH = 420;
const PANEL_HEIGHT = 448;
const BUTTON_WIDTH = 320;
const BUTTON_HEIGHT = 46;
const BUTTON_STEP = 58;
const FIRST_BUTTON_Y = 128;

type VisibleObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

interface PauseButton {
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export interface PauseMenuOptions {
  readonly subtitle: string;
  readonly onEndMission: () => void;
  readonly onMainMenu: () => void;
}

export class PauseMenu {
  readonly uiObjects: Phaser.GameObjects.GameObject[];
  private readonly chrome: VisibleObject[] = [];
  private readonly mainGroup: VisibleObject[] = [];
  private readonly optionsGroup: VisibleObject[] = [];
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly soundButton: PauseButton;
  private open = false;
  private optionsOpen = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: PauseMenuOptions,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const cx = width / 2;
    const top = Math.round((height - PANEL_HEIGHT) / 2);
    const objects: Phaser.GameObjects.GameObject[] = [];

    const register = <T extends VisibleObject>(object: T): T => {
      objects.push(object);
      return object;
    };

    const backdrop = register(
      scene.add
        .rectangle(0, 0, width, height, 0x05080c, 0.62)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setInteractive({ useHandCursor: true }),
    );
    backdrop.on('pointerdown', () => this.hide());

    const panel = register(
      scene.add
        .rectangle(cx, top + PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 0x0b1118, 0.98)
        .setStrokeStyle(1, 0x2c4437, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setInteractive(),
    );

    this.title = register(
      scene.add
        .text(cx, top + 34, 'PAUZA', {
          fontFamily: 'Trebuchet MS, Verdana, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#f1f5f9',
        })
        .setOrigin(0.5)
        .setLetterSpacing(4)
        .setScrollFactor(0)
        .setDepth(DEPTH),
    );

    const subtitle = register(
      scene.add
        .text(cx, top + 66, this.options.subtitle, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#8fa3b8',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH),
    );

    this.hint = register(
      scene.add
        .text(cx, top + PANEL_HEIGHT - 28, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#6b7d90',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH),
    );

    this.chrome.push(backdrop, panel, this.title, subtitle, this.hint);

    const main = [
      this.button(objects, 'KONTYNUUJ', cx, top + FIRST_BUTTON_Y, () => this.hide()),
      this.button(objects, 'OPCJE', cx, top + FIRST_BUTTON_Y + BUTTON_STEP, () =>
        this.showOptions(),
      ),
      this.button(
        objects,
        'ZAKOŃCZ MISJĘ',
        cx,
        top + FIRST_BUTTON_Y + BUTTON_STEP * 2,
        () => this.options.onEndMission(),
      ),
      this.button(
        objects,
        'MENU GŁÓWNE',
        cx,
        top + FIRST_BUTTON_Y + BUTTON_STEP * 3,
        () => this.options.onMainMenu(),
      ),
    ];

    this.soundButton = this.button(
      objects,
      'DŹWIĘK',
      cx,
      top + FIRST_BUTTON_Y,
      () => this.toggleSound(),
    );
    const back = this.button(
      objects,
      'WRÓĆ',
      cx,
      top + FIRST_BUTTON_Y + BUTTON_STEP,
      () => this.showMain(),
    );

    this.uiObjects = objects;
    this.mainGroup.push(...main.flatMap((button) => [button.box, button.label]));
    this.optionsGroup.push(this.soundButton.box, this.soundButton.label, back.box, back.label);

    this.applyState();
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(): void {
    this.open = true;
    this.optionsOpen = false;
    this.applyState();
  }

  hide(): void {
    this.open = false;
    this.optionsOpen = false;
    this.applyState();
  }

  private button(
    objects: Phaser.GameObjects.GameObject[],
    text: string,
    x: number,
    y: number,
    onClick: () => void,
  ): PauseButton {
    const box = this.scene.add
      .rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, 0x111826, 0.95)
      .setStrokeStyle(1, 0x2c4437, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#e8eef5',
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)
      .setScrollFactor(0)
      .setDepth(DEPTH);

    objects.push(box, label);

    box.on('pointerover', () => {
      box.setFillStyle(0x17252f, 0.98);
      box.setStrokeStyle(1, 0x6fd08c, 1);
      label.setColor('#ffffff');
    });
    box.on('pointerout', () => {
      box.setFillStyle(0x111826, 0.95);
      box.setStrokeStyle(1, 0x2c4437, 1);
      label.setColor('#e8eef5');
    });
    box.on('pointerdown', onClick);

    return { box, label };
  }

  private showOptions(): void {
    this.optionsOpen = true;
    this.applyState();
  }

  private showMain(): void {
    this.optionsOpen = false;
    this.applyState();
  }

  private toggleSound(): void {
    setSoundEnabled(!isSoundEnabled());
    this.refreshSoundLabel();
  }

  private refreshSoundLabel(): void {
    this.soundButton.label.setText(`DŹWIĘK: ${isSoundEnabled() ? 'WŁĄCZONY' : 'WYŁĄCZONY'}`);
  }

  private applyState(): void {
    this.setVisible(this.chrome, this.open);
    this.setVisible(this.mainGroup, this.open && !this.optionsOpen);
    this.setVisible(this.optionsGroup, this.open && this.optionsOpen);

    this.title.setText(this.optionsOpen ? 'OPCJE' : 'PAUZA');
    this.hint.setText(this.optionsOpen ? 'ESC — powrót do pauzy' : 'ESC — powrót do gry');
    this.refreshSoundLabel();
  }

  private setVisible(objects: readonly VisibleObject[], visible: boolean): void {
    for (const object of objects) {
      object.setVisible(visible);
    }
  }
}
