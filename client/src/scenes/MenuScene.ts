import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private entries: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    const { width, height } = this.scale;

    this.title = this.add
      .text(width / 2, height / 2 - 70, 'My Very Advance Wars', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    this.addMenuEntry(width / 2, height / 2 - 10, 'Scenariusze', () =>
      this.scene.start('scenario-menu'),
    );
    this.addMenuEntry(width / 2, height / 2 + 30, 'Edytor map', () =>
      this.scene.start('map-menu'),
    );
    this.addMenuEntry(width / 2, height / 2 + 70, 'Wyjście', () => this.quit());

    this.hint = this.add
      .text(width / 2, height - 30, 'Wskaż opcję myszką', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fb0a5',
      })
      .setOrigin(0.5);
  }

  private addMenuEntry(x: number, y: number, label: string, action: () => void): void {
    const button = this.add
      .text(x, y, `> ${label} <`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setColor('#a6f4c5'));
    button.on('pointerout', () => button.setColor('#ffffff'));
    button.on('pointerdown', action);

    this.entries.push(button);
  }

  private quit(): void {
    window.close();

    this.title.setVisible(false);
    this.hint.setVisible(false);

    for (const entry of this.entries) {
      entry.setVisible(false);
    }

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Zamknij okno, aby zakończyć grę', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8e2dc',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
