import Phaser from 'phaser';
import { toggleAccountOverlay } from '../view/accountOverlay';
import { installButtonClickSound } from '../view/buttonAudio';
import { drawEmblem, drawMenuBackdrop } from '../view/menuBackdrop';
import { createMenuButton } from '../view/menuButton';
import { MenuMusic } from '../view/menuMusic';
import { preloadTerrainTiles } from '../view/terrainTiles';

const GAME_TITLE = 'My Very Advance Wars';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private entries: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('menu');
  }

  preload(): void {
    preloadTerrainTiles(this);
  }

  create(): void {
    installButtonClickSound(this);
    drawMenuBackdrop(this);

    const { width, height } = this.scale;
    const cx = width / 2;

    drawEmblem(this, cx, 130, 52);

    this.title = this.add
      .text(cx, 226, GAME_TITLE.toUpperCase(), {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#f1f5f9',
        stroke: '#05080d',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setLetterSpacing(4);

    this.subtitle = this.add
      .text(cx, 270, 'TUROWA WOJNA NA HEKSACH', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '14px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);

    this.add
      .text(width - 24, 24, 'KONTO', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '13px',
        color: '#8fa3b8',
      })
      .setOrigin(1, 0)
      .setLetterSpacing(2)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function (this: Phaser.GameObjects.Text) {
        this.setColor('#a6f4c5');
      })
      .on('pointerout', function (this: Phaser.GameObjects.Text) {
        this.setColor('#8fa3b8');
      })
      .on('pointerdown', () => toggleAccountOverlay());

    const items: [string, 'blue' | 'red' | 'neutral', () => void][] = [
      ['Kampanie', 'blue', () => this.scene.start('campaign-menu')],
      ['Scenariusze', 'blue', () => this.scene.start('scenario-menu')],
      ['Edytor map', 'red', () => this.scene.start('map-menu')],
      ['Wyjście', 'neutral', () => this.quit()],
    ];
    items.forEach(([label, accent, action], i) => {
      this.entries.push(createMenuButton(this, cx, 340 + i * 62, label, accent, action).container);
    });

    this.setupMusic();

    this.hint = this.add
      .text(cx, height - 28, 'Wskaż opcję myszką', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#6b7d90',
      })
      .setOrigin(0.5);
  }

  private setupMusic(): void {
    const music = MenuMusic.create(this);
    if (!music) {
      return;
    }

    music.start();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => music.stop());
  }

  private quit(): void {
    window.close();

    this.title.setVisible(false);
    this.hint.setVisible(false);
    this.subtitle.setVisible(false);

    for (const entry of this.entries) {
      entry.setVisible(false);
    }

    this.add
      .text(this.scale.width / 2, this.scale.height - 90, 'Zamknij okno, aby zakończyć grę', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8e2dc',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
