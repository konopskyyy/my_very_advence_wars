import Phaser from 'phaser';
import { MAP_NAME_MAX_LENGTH, normalizeMapName } from '../core/map';
import { EDITOR_PANEL_WIDTH, EDITOR_PANEL_X, EDITOR_PANEL_Y } from './editorMenu';

const NAME_LABEL_Y = EDITOR_PANEL_Y + 36;
const FIELD_X = EDITOR_PANEL_X + 12;
const FIELD_Y = EDITOR_PANEL_Y + 50;
const FIELD_WIDTH = EDITOR_PANEL_WIDTH - 24;
const FIELD_HEIGHT = 20;

export class MapNameField {
  private readonly field: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private editing = false;
  private draft = '';
  private name: string;

  constructor(
    scene: Phaser.Scene,
    value: string,
    private readonly onChange: (name: string) => void,
    private readonly onStart?: () => void,
  ) {
    this.name = value;

    scene.add
      .text(FIELD_X, NAME_LABEL_Y, 'NAZWA', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(11);

    this.field = scene.add.rectangle(
      FIELD_X,
      FIELD_Y,
      FIELD_WIDTH,
      FIELD_HEIGHT,
      0x142018,
      0.9,
    );
    this.field.setOrigin(0, 0);
    this.field.setStrokeStyle(1, 0x2a3f33, 1);
    this.field.setScrollFactor(0);
    this.field.setDepth(10.5);
    this.field.setInteractive({ useHandCursor: true });
    this.field.on('pointerover', () => {
      if (!this.editing) {
        this.field.setStrokeStyle(1, 0x6fbf8f, 1);
      }
    });
    this.field.on('pointerout', () => {
      if (!this.editing) {
        this.field.setStrokeStyle(1, 0x2a3f33, 1);
      }
    });
    this.field.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) {
        this.onStart?.();
        this.start();
      }
    });

    this.text = scene.add
      .text(FIELD_X + 6, FIELD_Y + FIELD_HEIGHT / 2, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f2f5f7',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.refresh();
  }

  get isEditing(): boolean {
    return this.editing;
  }

  get value(): string {
    return this.name;
  }

  setValue(value: string): void {
    this.name = value;
    this.refresh();
  }

  start(): void {
    if (this.editing) {
      return;
    }

    this.editing = true;
    this.draft = this.name;
    this.field.setStrokeStyle(2, 0xa6f4c5, 1);
    this.refresh();
  }

  commit(): string {
    this.name = normalizeMapName(this.draft) || 'nowa';
    this.editing = false;
    this.draft = '';
    this.field.setStrokeStyle(1, 0x2a3f33, 1);
    this.refresh();
    this.onChange(this.name);

    return this.name;
  }

  cancel(): void {
    this.editing = false;
    this.draft = '';
    this.field.setStrokeStyle(1, 0x2a3f33, 1);
    this.refresh();
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.draft = this.draft.slice(0, -1);
      this.refresh();
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      this.draft = '';
      this.refresh();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    event.preventDefault();

    if (this.draft.length >= MAP_NAME_MAX_LENGTH) {
      return;
    }

    this.draft += event.key;
    this.refresh();
  }

  refresh(): void {
    const value = this.editing ? this.draft : this.name;

    this.text.setText(this.editing ? `${value}▌` : value);
  }
}
