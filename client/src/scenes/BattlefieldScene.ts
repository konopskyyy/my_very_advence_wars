import Phaser from 'phaser';
import { createMap } from '../core/map';
import { HEX_SIZE, HexMapView } from '../view/hexGrid';

const MAP_COLS = 16;
const MAP_ROWS = 10;

export class BattlefieldScene extends Phaser.Scene {
  constructor() {
    super('battlefield');
  }

  create(): void {
    const map = createMap(MAP_COLS, MAP_ROWS);
    const view = new HexMapView(this, map);

    const camera = this.cameras.main;
    camera.setBounds(
      -HEX_SIZE,
      -HEX_SIZE,
      MAP_COLS * HEX_SIZE * 1.74 + HEX_SIZE * 2,
      MAP_ROWS * HEX_SIZE * 1.5 + HEX_SIZE * 2,
    );

    const middle = view.center({ col: Math.floor(MAP_COLS / 2), row: Math.floor(MAP_ROWS / 2) });
    camera.centerOn(middle.x, middle.y);

    const width = this.scale.width;
    const height = this.scale.height;

    this.add
      .text(width / 2, height / 2, 'My Very Advance Wars', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 24, 'E — edytor map', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'e') {
        this.scene.start('map-editor');
      }
    });
  }
}
