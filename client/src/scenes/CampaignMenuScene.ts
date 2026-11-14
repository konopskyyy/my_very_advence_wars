import Phaser from 'phaser';
import { CAMPAIGNS, findCampaign, type CampaignId } from '../core/campaign';
import { installButtonClickSound } from '../view/buttonAudio';
import { CampaignRibbon } from '../view/campaignRibbon';
import { CampaignTiles } from '../view/campaignTiles';
import { readCompletedMissions } from '../storage/progress';

const TITLE_Y = 30;
const RIBBON_X = 120;
const RIBBON_Y = 64;
const RIBBON_WIDTH = 1040;
const RIBBON_HEIGHT = 46;
const CONTENT_GAP = 12;
const CONTENT_BOTTOM_MARGIN = 64;

export class CampaignMenuScene extends Phaser.Scene {
  private ribbon!: CampaignRibbon;
  private tiles!: CampaignTiles;

  constructor() {
    super('campaign-menu');
  }

  create(): void {
    installButtonClickSound(this);

    const { width, height } = this.scale;
    const contentY = RIBBON_Y + RIBBON_HEIGHT + CONTENT_GAP;
    const contentHeight = height - contentY - CONTENT_BOTTOM_MARGIN;

    this.add
      .text(width / 2, TITLE_Y, 'Kampanie', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5);

    this.add
      .rectangle(RIBBON_X, contentY, RIBBON_WIDTH, contentHeight, 0x0b0f14, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x2c4437, 1);

    this.ribbon = new CampaignRibbon(this, {
      x: RIBBON_X,
      y: RIBBON_Y,
      width: RIBBON_WIDTH,
      height: RIBBON_HEIGHT,
      tabs: CAMPAIGNS.map((campaign) => ({ id: campaign.id, label: campaign.title })),
      onSelect: (id) => this.select(id),
    });

    this.tiles = new CampaignTiles(this, {
      x: RIBBON_X,
      y: contentY,
      width: RIBBON_WIDTH,
      height: contentHeight,
      onLaunch: (mission) =>
        this.scene.start('scenario', {
          definition: mission,
          playerFaction: 'blue',
          returnScene: 'campaign-menu',
          returnLabel: 'MENU KAMPANII',
        }),
    });

    this.select(CAMPAIGNS[0]?.id ?? 'tutorial');

    const back = this.add
      .text(width / 2, height - 26, '> Menu główne <', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setColor('#a6f4c5'));
    back.on('pointerout', () => back.setColor('#ffffff'));
    back.on('pointerdown', () => this.scene.start('menu'));

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.scene.start('menu');
      }
    });
  }

  private select(id: CampaignId): void {
    const campaign = findCampaign(id);

    if (!campaign) {
      return;
    }

    this.ribbon.setActive(id);
    this.tiles.show(campaign, readCompletedMissions());
  }
}
