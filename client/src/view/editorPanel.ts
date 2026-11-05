import Phaser from 'phaser';
import { DevBar, type DevBarMetrics } from './devBar';
import { buildEditorHud, type EditorHudInput } from './editorHud';
import {
  EDITOR_FACTION_BUTTON_HEIGHT,
  EDITOR_FACTION_TOP,
  EDITOR_HUD_Y,
  EDITOR_PANEL_WIDTH,
  EDITOR_PANEL_X,
  EDITOR_PANEL_Y,
  EDITOR_TERRAIN_LABEL_Y,
  EDITOR_UNIT_LABEL_Y,
} from './editorMenu';
import { MapNameField } from './mapNameField';

const TITLE_Y = EDITOR_PANEL_Y + 10;
const BUTTONS_Y = 26;

export interface EditorPanelHandlers {
  readonly onNameChange: (name: string) => void;
  readonly onNameFocus: () => void;
  readonly onMapMenu: () => void;
  readonly onMainMenu: () => void;
  readonly onSave: () => void;
  readonly onCreateScenario: () => void;
}

export class EditorPanel {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly hud: Phaser.GameObjects.Text;
  private readonly nameField: MapNameField;
  private readonly devBar?: DevBar;
  private readonly saveButton: Phaser.GameObjects.Text;
  private readonly mapButton: Phaser.GameObjects.Text;
  private readonly menuButton: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    mapName: string,
    devTools: boolean,
    private readonly handlers: EditorPanelHandlers,
  ) {
    this.panel = scene.add.rectangle(
      EDITOR_PANEL_X,
      EDITOR_PANEL_Y,
      EDITOR_PANEL_WIDTH,
      160,
      0x0b0f14,
      0.85,
    );
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(1, 0x3d6b4f, 1);
    this.panel.setScrollFactor(0);
    this.panel.setDepth(10);

    scene.add
      .text(EDITOR_PANEL_X + 12, TITLE_Y, 'EDYTOR MAP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d8e2dc',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.nameField = new MapNameField(
      scene,
      mapName,
      handlers.onNameChange,
      handlers.onNameFocus,
    );

    scene.add
      .text(EDITOR_PANEL_X + 12, EDITOR_TERRAIN_LABEL_Y, 'TEREN', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    scene.add
      .text(EDITOR_PANEL_X + 12, EDITOR_UNIT_LABEL_Y, 'JEDNOSTKI', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    scene.add
      .text(
        EDITOR_PANEL_X + 12,
        EDITOR_FACTION_TOP + EDITOR_FACTION_BUTTON_HEIGHT / 2,
        'STRONA',
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.hud = scene.add.text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d8e2dc',
    });
    this.hud.setScrollFactor(0);
    this.hud.setDepth(11);

    if (devTools) {
      this.devBar = new DevBar(scene, EDITOR_PANEL_X + 12, EDITOR_HUD_Y, 'left');
    }

    this.mapButton = scene.add
      .text(EDITOR_PANEL_X + 90, EDITOR_HUD_Y, 'MENU MAP', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.mapButton.on('pointerover', () => this.mapButton.setColor('#a6f4c5'));
    this.mapButton.on('pointerout', () => this.mapButton.setColor('#ffffff'));
    this.mapButton.on('pointerdown', () => this.handlers.onMapMenu());

    this.menuButton = scene.add
      .text(EDITOR_PANEL_X + 160, EDITOR_HUD_Y, 'MENU GŁÓWNE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.menuButton.on('pointerover', () => this.menuButton.setColor('#a6f4c5'));
    this.menuButton.on('pointerout', () => this.menuButton.setColor('#ffffff'));
    this.menuButton.on('pointerdown', () => this.handlers.onMainMenu());

    scene.add
      .text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y + 16, 'UTWÓRZ SCENARIUSZ', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', (object: Phaser.GameObjects.Text) => object.setColor('#a6f4c5'))
      .on('pointerout', (object: Phaser.GameObjects.Text) => object.setColor('#9fb0a5'))
      .on('pointerdown', () => this.handlers.onCreateScenario());

    this.saveButton = scene.add
      .text(EDITOR_PANEL_X + 12, EDITOR_HUD_Y, 'ZAPISZ', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a6f4c5',
      })
      .setScrollFactor(0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    this.saveButton.on('pointerover', () => this.saveButton.setColor('#ffffff'));
    this.saveButton.on('pointerout', () => this.saveButton.setColor('#a6f4c5'));
    this.saveButton.on('pointerdown', () => this.handlers.onSave());
  }

  get isEditingName(): boolean {
    return this.nameField.isEditing;
  }

  commitName(): void {
    this.nameField.commit();
  }

  handleNameKey(event: KeyboardEvent): void {
    this.nameField.handleKey(event);
  }

  setName(name: string): void {
    this.nameField.setValue(name);
  }

  contains(pointer: Phaser.Input.Pointer): boolean {
    return (
      pointer.x >= EDITOR_PANEL_X &&
      pointer.x <= EDITOR_PANEL_X + this.panel.width &&
      pointer.y >= EDITOR_PANEL_Y &&
      pointer.y <= EDITOR_PANEL_Y + this.panel.height
    );
  }

  refresh(input: EditorHudInput): void {
    this.hud.setText(buildEditorHud(input));
    this.nameField.refresh();
    this.drawButtons();
    this.layout();
  }

  updateDevBar(delta: number, metrics: DevBarMetrics): void {
    this.devBar?.update(delta, metrics);
    this.layout();
  }

  setSaveStatus(text: string): void {
    this.saveButton.setText(text);
  }

  private drawButtons(): void {
    const y = EDITOR_HUD_Y + this.hud.height + 4;

    this.saveButton.setY(y);
    this.mapButton.setY(y);
    this.menuButton.setY(y);

    if (this.devBar) {
      this.devBar.setPosition(EDITOR_PANEL_X + 12, y + 22);
    }
  }

  private layout(): void {
    this.panel.setSize(
      Math.max(EDITOR_PANEL_WIDTH, this.hud.width + 24),
      this.panelContentBottom() - EDITOR_PANEL_Y,
    );
  }

  private panelContentBottom(): number {
    const buttonsBottom = EDITOR_HUD_Y + this.hud.height + BUTTONS_Y;

    if (!this.devBar) {
      return buttonsBottom;
    }

    return Math.max(buttonsBottom, this.devBar.y + this.devBar.height + 12);
  }
}
