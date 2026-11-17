import Phaser from 'phaser';
import { CAMPAIGNS, findCampaign, type CampaignId } from '../core/campaign';
import { installButtonClickSound } from '../view/buttonAudio';
import { CampaignRibbon } from '../view/campaignRibbon';
import { CampaignTiles } from '../view/campaignTiles';
import { FACTION_THEMES } from '../view/factionTheme';
import { drawEmblem, drawMenuBackdrop } from '../view/menuBackdrop';
import { MenuMusic } from '../view/menuMusic';
import { readCompletedMissions } from '../storage/progress';

const TITLE_Y = 112;
const RIBBON_X = 120;
const RIBBON_Y = 158;
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
    drawMenuBackdrop(this);

    const { width, height } = this.scale;
    const cx = width / 2;
    const contentY = RIBBON_Y + RIBBON_HEIGHT + CONTENT_GAP;
    const contentHeight = height - contentY - CONTENT_BOTTOM_MARGIN;

    drawEmblem(this, cx, 58, 24);

    this.add
      .text(cx, TITLE_Y, 'KAMPANIE', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#f1f5f9',
        stroke: '#05080d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setLetterSpacing(4);

    this.add
      .text(cx, TITLE_Y + 26, 'SAMOUCZEK I KAMPANIE', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);

    const theme = FACTION_THEMES.blue;
    this.add
      .rectangle(RIBBON_X, contentY, RIBBON_WIDTH, contentHeight, theme.barBackground, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, theme.divider, 1);

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
    this.setupMusic();

    const back = this.add
      .text(cx, height - 28, '> MENU GŁÓWNE <', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)
      .setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setColor('#a6f4c5'));
    back.on('pointerout', () => back.setColor('#8fa3b8'));
    back.on('pointerdown', () => this.scene.start('menu'));

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.scene.start('menu');
      }
    });
  }

  private setupMusic(): void {
    const music = MenuMusic.create(this);
    if (!music) {
      return;
    }

    music.start();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => music.stop());
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
