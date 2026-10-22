import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, 'My Very Advance Wars', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    const editorButton = this.add
      .text(width / 2, height / 2 + 20, '> Edytor map <', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    editorButton.on('pointerover', () => editorButton.setColor('#a6f4c5'));
    editorButton.on('pointerout', () => editorButton.setColor('#ffffff'));
    editorButton.on('pointerdown', () => this.scene.start('map-editor'));

    const battleButton = this.add
      .text(width / 2, height / 2 + 60, '> Pole bitwy <', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    battleButton.on('pointerover', () => battleButton.setColor('#a6f4c5'));
    battleButton.on('pointerout', () => battleButton.setColor('#ffffff'));
    battleButton.on('pointerdown', () => this.scene.start('battlefield'));

    this.add
      .text(width / 2, height - 30, 'Wskaż opcję myszką', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
      })
      .setOrigin(0.5);
  }
}
