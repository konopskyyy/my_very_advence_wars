import Phaser from 'phaser';
import type { CampaignId } from '../core/campaign';

export interface CampaignRibbonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tabs: readonly { readonly id: CampaignId; readonly label: string }[];
  readonly onSelect: (id: CampaignId) => void;
}

interface RibbonTab {
  readonly id: CampaignId;
  readonly background: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly underline: Phaser.GameObjects.Rectangle;
}

const TAB_WIDTH = 210;
const TAB_GAP = 6;
const PADDING = 10;
const ACTIVE_FILL = 0x15231b;
const INACTIVE_FILL = 0x0d1319;
const ACTIVE_STROKE = 0x6fd08c;
const INACTIVE_STROKE = 0x2c4437;

export class CampaignRibbon {
  private readonly tabs: RibbonTab[] = [];
  private active: CampaignId | null = null;

  constructor(scene: Phaser.Scene, options: CampaignRibbonOptions) {
    scene.add
      .rectangle(options.x, options.y, options.width, options.height, 0x0d1319, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, INACTIVE_STROKE, 1);

    options.tabs.forEach((tab, index) => {
      const x = options.x + PADDING + index * (TAB_WIDTH + TAB_GAP);

      const background = scene.add.rectangle(
        x,
        options.y + 4,
        TAB_WIDTH,
        options.height - 8,
        INACTIVE_FILL,
        1,
      );
      background.setOrigin(0, 0);
      background.setStrokeStyle(1, INACTIVE_STROKE, 1);
      background.setInteractive({ useHandCursor: true });

      const label = scene.add
        .text(x + TAB_WIDTH / 2, options.y + options.height / 2, tab.label, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#9fb0a5',
        })
        .setOrigin(0.5);

      const underline = scene.add.rectangle(
        x + 6,
        options.y + options.height - 8,
        TAB_WIDTH - 12,
        2,
        ACTIVE_STROKE,
        1,
      );
      underline.setOrigin(0, 0);
      underline.setVisible(false);

      background.on('pointerover', () => {
        if (this.active === tab.id) {
          return;
        }

        background.setFillStyle(ACTIVE_FILL, 1);
        label.setColor('#d8e2dc');
      });
      background.on('pointerout', () => {
        if (this.active === tab.id) {
          return;
        }

        background.setFillStyle(INACTIVE_FILL, 1);
        label.setColor('#9fb0a5');
      });
      background.on('pointerdown', () => options.onSelect(tab.id));

      this.tabs.push({ id: tab.id, background, label, underline });
    });
  }

  setActive(id: CampaignId): void {
    this.active = id;

    for (const tab of this.tabs) {
      const isActive = tab.id === id;

      tab.background.setFillStyle(isActive ? ACTIVE_FILL : INACTIVE_FILL, 1);
      tab.background.setStrokeStyle(1, isActive ? ACTIVE_STROKE : INACTIVE_STROKE, 1);
      tab.label.setColor(isActive ? '#ffffff' : '#9fb0a5');
      tab.underline.setVisible(isActive);
    }
  }
}
