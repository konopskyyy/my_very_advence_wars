import type Phaser from 'phaser';
import type { HexCoord } from '../core/map';

const DEPTH = 40;
const BADGE_WIDTH = 24;
const BADGE_HEIGHT = 24;
const POOL_SIZE = 12;

const BOARD_COLOR = 0x5aa9e6;
const UNLOAD_COLOR = 0xffb347;

export interface TransportBadge {
  readonly kind: 'board' | 'unload';
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly passengerId: string;
  readonly vehicleId: string;
  readonly target?: HexCoord;
}

interface BadgeView {
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export class TransportIcons {
  private readonly views: BadgeView[] = [];
  private active: readonly TransportBadge[] = [];

  constructor(scene: Phaser.Scene) {
    for (let index = 0; index < POOL_SIZE; index += 1) {
      const box = scene.add
        .rectangle(0, 0, BADGE_WIDTH, BADGE_HEIGHT, BOARD_COLOR, 1)
        .setScrollFactor(0)
        .setDepth(DEPTH)
        .setStrokeStyle(1, 0xffffff, 0.85)
        .setVisible(false);
      const label = scene.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setVisible(false);

      this.views.push({ box, label });
    }
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.views.flatMap((view) => [view.box, view.label]);
  }

  show(badges: readonly TransportBadge[]): void {
    this.active = badges;

    this.views.forEach((view, index) => {
      const badge = badges[index];

      if (!badge) {
        view.box.setVisible(false);
        view.label.setVisible(false);
        return;
      }

      view.box
        .setPosition(badge.x, badge.y)
        .setFillStyle(badge.kind === 'board' ? BOARD_COLOR : UNLOAD_COLOR, 1)
        .setVisible(true);
      view.label
        .setPosition(badge.x, badge.y)
        .setText(badge.label)
        .setVisible(true);
    });
  }

  hide(): void {
    this.show([]);
  }

  hitAt(x: number, y: number): TransportBadge | null {
    for (const badge of this.active) {
      if (
        Math.abs(x - badge.x) <= BADGE_WIDTH / 2 &&
        Math.abs(y - badge.y) <= BADGE_HEIGHT / 2
      ) {
        return badge;
      }
    }

    return null;
  }
}
