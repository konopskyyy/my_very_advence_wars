import Phaser from 'phaser';

const DEPTH = 80;
const WIDTH = 640;
const HEIGHT = 42;

export class ReplayBanner {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.panel = scene.add
      .rectangle(scene.scale.width / 2, 18, WIDTH, HEIGHT, 0x05080c, 0.9)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setStrokeStyle(1, 0xf2d35c, 0.9);

    this.label = scene.add
      .text(scene.scale.width / 2, 18 + HEIGHT / 2, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f2d35c',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.objects.push(this.panel, this.label);
    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  show(text: string): void {
    this.label.setText(text);

    for (const object of this.objects) {
      object.setVisible(true);
    }
  }

  hide(): void {
    for (const object of this.objects) {
      object.setVisible(false);
    }
  }
}
