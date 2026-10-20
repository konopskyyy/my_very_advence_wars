import Phaser from 'phaser';

const TILE = 32;

class Battlefield extends Phaser.Scene {
  constructor() {
    super('battlefield');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    for (let y = 0; y < height; y += TILE) {
      for (let x = 0; x < width; x += TILE) {
        const dark = (x / TILE + y / TILE) % 2 === 0;
        this.add.rectangle(x, y, TILE, TILE, dark ? 0x3d6b4f : 0x4d8261)
          .setOrigin(0, 0);
      }
    }

    this.add.text(width / 2, height / 2, 'My Very Advance Wars', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0b0b',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 270,
  },
  scene: [Battlefield],
});
