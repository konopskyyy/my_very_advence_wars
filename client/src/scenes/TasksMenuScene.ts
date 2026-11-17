import Phaser from 'phaser';
import {
  CAMPAIGNS,
  isMissionCompleted,
  tileStatus,
  type CampaignTile,
  type TileStatus,
} from '../core/campaign';
import { readCompletedMissions } from '../storage/progress';
import { installButtonClickSound } from '../view/buttonAudio';
import { ScrollList } from '../view/scrollList';

const TITLE_Y = 30;
const LIST_X = 60;
const LIST_Y = 78;
const LIST_BOTTOM_MARGIN = 84;
const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 30;

interface TaskStatus {
  readonly label: string;
  readonly color: string;
  readonly playable: boolean;
}

const STATUS_PRESENTATION: Record<TileStatus, { label: string; color: string }> = {
  preview: { label: 'WKRÓTCE', color: '#c4a85f' },
  completed: { label: 'UKOŃCZONA', color: '#5fb3d4' },
  locked: { label: 'ZABLOKOWANA', color: '#c47b7b' },
  ready: { label: 'DO ZROBIENIA', color: '#6fd08c' },
};

function taskStatus(tile: CampaignTile, completed: ReadonlySet<string>): TaskStatus {
  const status = tileStatus(tile, completed);

  return {
    ...STATUS_PRESENTATION[status],
    playable: status === 'completed' || status === 'ready',
  };
}

export class TasksMenuScene extends Phaser.Scene {
  private notice?: Phaser.GameObjects.Text;

  constructor() {
    super('tasks-menu');
  }

  create(): void {
    installButtonClickSound(this);

    const { width, height } = this.scale;
    const listWidth = width - LIST_X * 2;
    const completed = readCompletedMissions();

    this.add
      .text(width / 2, TITLE_Y, 'Zadania', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#d8e2dc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(width / 2, TITLE_Y + 26, 'Ukończone misje są odhaczone', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#7fa08b',
      })
      .setOrigin(0.5)
      .setDepth(10);

    const list = new ScrollList(this, {
      x: LIST_X,
      y: LIST_Y,
      width: listWidth,
      height: height - LIST_Y - LIST_BOTTOM_MARGIN,
    });

    for (const campaign of CAMPAIGNS) {
      this.addHeader(list, campaign.title, listWidth);
      for (const tile of campaign.tiles) {
        this.addTaskRow(list, listWidth, tile, completed);
      }
    }

    this.notice = this.add
      .text(width / 2, height - 58, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#c4a85f',
      })
      .setOrigin(0.5)
      .setDepth(10);

    const back = this.add
      .text(width / 2, height - 28, '> Menu główne <', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10)
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

  private addHeader(list: ScrollList, title: string, width: number): void {
    const container = this.add.container(0, 0);
    const line = this.add.rectangle(0, HEADER_HEIGHT / 2, width, 1, 0x2c4437, 0.8).setOrigin(0, 0.5);
    const label = this.add
      .text(0, HEADER_HEIGHT / 2, title.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9fb0a5',
      })
      .setOrigin(0, 0.5);

    container.add([line, label]);
    list.addRow(container, HEADER_HEIGHT);
  }

  private addTaskRow(
    list: ScrollList,
    width: number,
    tile: CampaignTile,
    completed: ReadonlySet<string>,
  ): void {
    const status = taskStatus(tile, completed);
    const done = isMissionCompleted(tile, completed);
    const container = this.add.container(0, 0);
    const background = this.add
      .rectangle(0, 0, width - 12, ROW_HEIGHT, done ? 0x0d1a23 : 0x0b0f14, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x2a3f33, 1);
    const box = this.add
      .text(12, ROW_HEIGHT / 2, done ? '[x]' : '[ ]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: done ? '#6fd08c' : '#5d6f63',
      })
      .setOrigin(0, 0.5);
    const title = this.add
      .text(56, ROW_HEIGHT / 2, tile.title, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: done ? '#d8e2dc' : '#c3cfc7',
      })
      .setOrigin(0, 0.5);
    const label = this.add
      .text(width - 24, ROW_HEIGHT / 2, status.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: status.color,
      })
      .setOrigin(1, 0.5);

    if (!status.playable) {
      title.setAlpha(0.6);
    }

    container.add([background, box, title, label]);
    list.addRow(container, ROW_HEIGHT);

    background.setInteractive({ useHandCursor: status.playable });

    background.on('pointerover', () => {
      if (status.playable) {
        background.setFillStyle(0x17252f, 0.95);
        background.setStrokeStyle(1, 0x6fd08c, 0.8);
      }
    });
    background.on('pointerout', () => {
      background.setFillStyle(done ? 0x0d1a23 : 0x0b0f14, 0.9);
      background.setStrokeStyle(1, 0x2a3f33, 1);
    });
    background.on('pointerdown', () => {
      if (!status.playable) {
        this.showNotice(
          status.label === 'ZABLOKOWANA'
            ? 'Najpierw ukończ poprzednią misję tej kampanii'
            : 'Ta lekcja jest jeszcze w przygotowaniu',
        );
        return;
      }

      if (tile.mission) {
        this.scene.start('scenario', {
          definition: tile.mission,
          playerFaction: 'blue',
          returnScene: 'tasks-menu',
          returnLabel: 'ZADANIA',
        });
      }
    });
  }

  private showNotice(text: string): void {
    this.notice?.setText(text);
  }
}
