import Phaser from 'phaser';
import {
  type TimelineClip,
  type TurnPlan,
  type TurnTimeline,
} from '../core/plan';
import type { GameState } from '../core/state';
import type { TurnState } from '../core/turn';
import { FACTION_DEFS, UNIT_DEFS } from '../core/units';
import { FACTION_THEMES, type FactionTheme } from './factionTheme';
import { BAR_HEIGHT, PLANNER_COLLAPSED, PLANNER_EXPANDED, TURN_COLUMN_X } from './hudLayout';

const HEADER_HEIGHT = 34;
const LABEL_WIDTH = 150;
const TRACK_GAP = 12;
const RULER_HEIGHT = 16;
const MOVE_COLOR = 0x6fd08c;
const ATTACK_COLOR = 0xe0563f;
const PLAYHEAD_COLOR = 0xf2d35c;
const TRACK_BACKGROUND = 0x0b0f14;
const MAX_TRACK_HEIGHT = 24;
const TOGGLE_WIDTH = 96;
const BUTTON_GAP = 8;
const REMOVE_X = 240;
const REMOVE_WIDTH = 80;

export interface PlanTimelineView {
  readonly turn: TurnState;
  readonly state: GameState;
  readonly plan: TurnPlan;
  readonly timeline: TurnTimeline;
  readonly selectedUnitId: string | null;
  readonly previewMs: number | null;
}

export interface PlanTimelineHandlers {
  readonly onToggle?: () => void;
  readonly onPlay: () => void;
  readonly onScrub: (timeMs: number) => void;
  readonly onSelectUnit: (unitId: string) => void;
  readonly onRemoveAction?: (unitId: string, actionIndex: number) => void;
  readonly onRemoveLast?: () => void;
}

function rulerStep(durationMs: number): number {
  const ideal = durationMs / 8;

  for (const step of [200, 250, 500, 1000, 2000, 5000, 10000]) {
    if (step >= ideal) {
      return step;
    }
  }

  return 10000;
}

function clipColor(clip: TimelineClip): number {
  return clip.kind === 'move' ? MOVE_COLOR : ATTACK_COLOR;
}

export class PlanTimeline {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly dynamicLabels: Phaser.GameObjects.GameObject[] = [];
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly stripe: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly turnLabel: Phaser.GameObjects.Text;
  private readonly noticeText: Phaser.GameObjects.Text;
  private readonly toggleButton: Phaser.GameObjects.Rectangle;
  private readonly toggleLabel: Phaser.GameObjects.Text;
  private readonly playButton: Phaser.GameObjects.Rectangle;
  private readonly playLabel: Phaser.GameObjects.Text;
  private readonly removeButton: Phaser.GameObjects.Rectangle;
  private readonly removeLabel: Phaser.GameObjects.Text;
  private readonly timelineGraphics: Phaser.GameObjects.Graphics;
  private readonly playheadGraphics: Phaser.GameObjects.Graphics;
  private readonly scrubZone: Phaser.GameObjects.Rectangle;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly trackLabels: Phaser.GameObjects.Text[] = [];
  private readonly rulerLabels: Phaser.GameObjects.Text[] = [];

  private view: PlanTimelineView | null = null;
  private theme: FactionTheme = FACTION_THEMES.blue;
  private collapsed = false;
  private playing = false;
  private scrubbing = false;
  private timeMs = 0;
  private areaX = LABEL_WIDTH;
  private areaY = 0;
  private areaWidth = 1;
  private areaHeight = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: PlanTimelineHandlers,
  ) {
    const width = this.scene.scale.width;
    const areaX = LABEL_WIDTH;
    const areaY = this.scene.scale.height - BAR_HEIGHT - PLANNER_EXPANDED + HEADER_HEIGHT + 6;
    const areaWidth = Math.max(1, width - LABEL_WIDTH - 18);
    const areaHeight = Math.max(1, PLANNER_EXPANDED - HEADER_HEIGHT - TRACK_GAP);
    const column = this.column();

    this.background = this.register(
      this.scene.add
        .rectangle(0, 0, width, PLANNER_EXPANDED, this.theme.barBackground, 0.82)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(18),
    );
    this.background.setStrokeStyle(1, this.theme.accent, 1);

    this.stripe = this.register(
      this.scene.add
        .rectangle(0, 0, width, 2, this.theme.accent, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(19),
    );

    this.title = this.register(
      this.scene.add
        .text(14, 0, 'PLAN TURY', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.turnLabel = this.register(
      this.scene.add
        .text(104, 0, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.noticeText = this.register(
      this.scene.add
        .text(330, 0, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#e0a15a',
        })
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.toggleButton = this.register(
      this.scene.add
        .rectangle(column.x, 0, column.toggleWidth, 22, this.theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );
    this.toggleLabel = this.register(
      this.scene.add
        .text(0, 0, 'ZWIŃ', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.playButton = this.register(
      this.scene.add
        .rectangle(column.playX, 0, column.playWidth, 22, this.theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );
    this.playLabel = this.register(
      this.scene.add
        .text(0, 0, 'WYKONAJ TURĘ', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.removeButton = this.register(
      this.scene.add
        .rectangle(REMOVE_X, 0, REMOVE_WIDTH, 22, this.theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );
    this.removeLabel = this.register(
      this.scene.add
        .text(0, 0, 'USUŃ AKCJĘ', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.timelineGraphics = this.register(
      this.scene.add.graphics().setScrollFactor(0).setDepth(20),
    );
    this.playheadGraphics = this.register(
      this.scene.add.graphics().setScrollFactor(0).setDepth(21),
    );

    this.scrubZone = this.register(
      this.scene.add
        .rectangle(areaX, areaY, areaWidth, areaHeight, 0xffffff, 0.001)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(22)
        .setInteractive({ useHandCursor: true }),
    );

    this.hint = this.register(
      this.scene.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#6c7d72',
          wordWrap: { width: Math.max(120, width - LABEL_WIDTH - 40) },
        })
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.toggleButton.on('pointerover', () =>
      this.toggleButton.setFillStyle(this.theme.accent, 1),
    );
    this.toggleButton.on('pointerout', () =>
      this.toggleButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.toggleButton.on('pointerdown', () => this.toggle());

    this.playButton.on('pointerover', () => {
      if (!this.playing) {
        this.playButton.setFillStyle(this.theme.accent, 1);
      }
    });
    this.playButton.on('pointerout', () =>
      this.playButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.playButton.on('pointerdown', () => {
      if (!this.playing) {
        this.handlers.onPlay();
      }
    });

    this.removeButton.on('pointerover', () => {
      if (this.removeButton.input?.enabled) {
        this.removeButton.setFillStyle(this.theme.accent, 1);
      }
    });
    this.removeButton.on('pointerout', () =>
      this.removeButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.removeButton.on('pointerdown', () => this.handlers.onRemoveLast?.());

    this.scrubZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        const action = this.actionAt(pointer.x, pointer.y);

        if (action) {
          this.handlers.onRemoveAction?.(action.unitId, action.actionIndex);
        }

        return;
      }

      const unitId = this.unitAt(pointer.y);

      if (unitId) {
        this.handlers.onSelectUnit(unitId);
      }

      if (this.playing || this.durationMs() <= 0) {
        return;
      }

      this.scrubbing = true;
      this.handlers.onScrub(this.timeAt(pointer.x));
    });
    this.scrubZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.scrubbing || !pointer.isDown) {
        return;
      }

      this.handlers.onScrub(this.timeAt(pointer.x));
    });
    this.scrubZone.on('pointerup', () => {
      this.scrubbing = false;
    });

    this.layout();
    this.drawTimeline();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [...this.objects, ...this.dynamicLabels];
  }

  get height(): number {
    return this.collapsed ? PLANNER_COLLAPSED : PLANNER_EXPANDED;
  }

  get isCollapsed(): boolean {
    return this.collapsed;
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    this.handlers.onToggle?.();
    this.layout();
    this.drawTimeline();
  }

  setCollapsed(collapsed: boolean): void {
    if (this.collapsed === collapsed) {
      return;
    }

    this.collapsed = collapsed;
    this.layout();
    this.drawTimeline();
  }

  setVisible(visible: boolean): void {
    for (const object of this.uiObjects) {
      if ('setVisible' in object) {
        (object as Phaser.GameObjects.GameObject & { setVisible: (value: boolean) => void }).setVisible(visible);
      }
    }
  }

  cancelScrub(): void {
    this.scrubbing = false;
  }

  notice(text: string): void {
    this.noticeText.setText(text);
    this.scene.time.delayedCall(2400, () => {
      if (this.noticeText.text === text) {
        this.noticeText.setText('');
      }
    });
  }

  setPlaying(playing: boolean): void {
    this.playing = playing;
    this.scrubbing = false;
    this.playButton.setAlpha(playing ? 0.6 : 1);
    this.playLabel.setText(playing ? 'ODTWARZANIE…' : 'WYKONAJ TURĘ');

    if (playing) {
      this.noticeText.setText('');
    }
  }

  setPlayhead(timeMs: number): void {
    this.timeMs = Math.max(0, timeMs);
    this.drawPlayhead();
  }

  refresh(view: PlanTimelineView): void {
    this.view = view;
    this.timeMs = view.previewMs ?? 0;
    this.applyTheme(view.turn.faction);
    this.turnLabel.setText(
      `Tura ${view.turn.turn} — ${FACTION_DEFS[view.turn.faction].label}`,
    );

    const selectedPlan = view.plan.units.find(
      (unitPlan) => unitPlan.unitId === view.selectedUnitId,
    );
    this.setRemoveEnabled((selectedPlan?.actions.length ?? 0) > 0);
    this.drawTimeline();
  }

  private durationMs(): number {
    return this.view?.timeline.durationMs ?? 0;
  }

  private timeAt(x: number): number {
    const ratio = Phaser.Math.Clamp((x - this.areaX) / this.areaWidth, 0, 1);

    return ratio * this.durationMs();
  }

  private unitAt(y: number): string | null {
    const view = this.view;

    if (!view || view.plan.units.length === 0) {
      return null;
    }

    const trackTop = this.areaY + RULER_HEIGHT;
    const trackArea = Math.max(8, this.areaHeight - RULER_HEIGHT);
    const trackHeight = Math.min(MAX_TRACK_HEIGHT, trackArea / view.plan.units.length);
    const index = Math.floor((y - trackTop) / trackHeight);

    return view.plan.units[index]?.unitId ?? null;
  }

  private actionAt(
    x: number,
    y: number,
  ): { unitId: string; actionIndex: number } | null {
    const view = this.view;

    if (!view || view.plan.units.length === 0 || view.timeline.durationMs <= 0) {
      return null;
    }

    const duration = view.timeline.durationMs;
    const trackTop = this.areaY + RULER_HEIGHT;
    const trackArea = Math.max(8, this.areaHeight - RULER_HEIGHT);
    const trackHeight = Math.min(MAX_TRACK_HEIGHT, trackArea / view.plan.units.length);

    if (y < trackTop) {
      return null;
    }

    const index = Math.floor((y - trackTop) / trackHeight);
    const unitPlan = view.plan.units[index];

    if (!unitPlan) {
      return null;
    }

    const trackY = trackTop + index * trackHeight;
    const clipTop = trackY + 2;
    const clipBottom = clipTop + Math.max(4, trackHeight - 8);

    if (y < clipTop || y > clipBottom) {
      return null;
    }

    for (const clip of view.timeline.clips) {
      if (clip.unitId !== unitPlan.unitId) {
        continue;
      }

      const clipX = this.areaX + (clip.startMs / duration) * this.areaWidth;
      const clipWidth = Math.max(3, ((clip.endMs - clip.startMs) / duration) * this.areaWidth);

      if (x >= clipX && x <= clipX + clipWidth) {
        return { unitId: clip.unitId, actionIndex: clip.actionIndex };
      }
    }

    return null;
  }

  private setRemoveEnabled(enabled: boolean): void {
    this.removeButton.setAlpha(enabled ? 1 : 0.45);
    this.removeLabel.setAlpha(enabled ? 1 : 0.45);

    if (!enabled) {
      this.removeButton.setFillStyle(this.theme.accentDark, 1);
    }

    if (this.removeButton.input) {
      this.removeButton.input.enabled = enabled;
    }
  }

  private column(): {
    x: number;
    toggleWidth: number;
    playX: number;
    playWidth: number;
  } {
    const width = this.scene.scale.width;
    const playWidth = Math.max(80, width - TURN_COLUMN_X - 16 - TOGGLE_WIDTH - BUTTON_GAP);

    return {
      x: TURN_COLUMN_X,
      toggleWidth: TOGGLE_WIDTH,
      playX: TURN_COLUMN_X + TOGGLE_WIDTH + BUTTON_GAP,
      playWidth,
    };
  }

  private layout(): void {
    const width = this.scene.scale.width;
    const panelHeight = this.height;
    const panelY = this.scene.scale.height - BAR_HEIGHT - panelHeight;
    const theme = this.theme;
    const column = this.column();

    this.background.setPosition(0, panelY).setSize(width, panelHeight);
    this.stripe.setPosition(0, panelY).setSize(width, 2);
    this.title.setPosition(14, panelY + 9);
    this.turnLabel.setPosition(104, panelY + 11);
    this.noticeText.setPosition(330, panelY + 11);

    this.toggleButton.setPosition(column.x, panelY + 6);
    this.toggleLabel.setPosition(column.x + column.toggleWidth / 2, panelY + 17);
    this.playButton.setPosition(column.playX, panelY + 6);
    this.playLabel.setPosition(column.playX + column.playWidth / 2, panelY + 17);
    this.removeButton.setPosition(REMOVE_X, panelY + 6);
    this.removeLabel.setPosition(REMOVE_X + REMOVE_WIDTH / 2, panelY + 17);

    this.areaX = LABEL_WIDTH;
    this.areaY = panelY + HEADER_HEIGHT + 6;
    this.areaWidth = Math.max(1, width - LABEL_WIDTH - 18);
    this.areaHeight = Math.max(1, panelHeight - HEADER_HEIGHT - TRACK_GAP);

    this.scrubZone
      .setPosition(this.areaX, this.areaY)
      .setSize(this.areaWidth, this.areaHeight);

    this.hint.setPosition(this.areaX + 8, this.areaY + 22);
    this.hint.setWordWrapWidth(Math.max(120, this.areaWidth - 24));

    const visible = !this.collapsed;

    this.timelineGraphics.setVisible(visible);
    this.playheadGraphics.setVisible(visible);
    this.scrubZone.setVisible(visible);

    if (this.scrubZone.input) {
      this.scrubZone.input.enabled = visible;
    }
    this.hint.setVisible(visible);
    this.toggleLabel.setText(this.collapsed ? 'PLANUJ' : 'ZWIŃ');

    if (this.toggleLabel.text === 'ZWIŃ') {
      this.toggleLabel.setColor(theme.accentSoft);
    } else {
      this.toggleLabel.setColor('#ffffff');
    }
  }

  private applyTheme(faction: TurnState['faction']): void {
    const theme = FACTION_THEMES[faction];

    if (this.theme === theme) {
      return;
    }

    this.theme = theme;
    this.background.setFillStyle(theme.barBackground, 0.82);
    this.background.setStrokeStyle(1, theme.accent, 1);
    this.stripe.setFillStyle(theme.accent, 1);
    this.toggleButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.playButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.removeButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
  }

  private drawTimeline(): void {
    for (const label of this.trackLabels) {
      label.destroy();
    }

    for (const label of this.rulerLabels) {
      label.destroy();
    }

    this.trackLabels.length = 0;
    this.rulerLabels.length = 0;
    this.dynamicLabels.length = 0;
    this.timelineGraphics.clear();
    this.playheadGraphics.clear();

    const view = this.view;

    if (!view || this.collapsed) {
      return;
    }

    const duration = view.timeline.durationMs;
    const hasPlan = view.plan.units.some((unitPlan) => unitPlan.actions.length > 0);

    this.hint.setVisible(!hasPlan);

    if (!hasPlan) {
      this.hint.setText(
        'Najedź na jednostkę, żeby zobaczyć zasięg. Kliknij heks lub wroga, potem kliknij ponownie, żeby potwierdzić ruch albo atak.\nPPM na klipie usuwa akcję i późniejsze akcje jednostki, USUŃ albo Del usuwa ostatnią akcję wybranej jednostki.',
      );
      return;
    }

    this.hint.setVisible(false);

    if (duration <= 0) {
      return;
    }

    const areaX = this.areaX;
    const areaWidth = this.areaWidth;
    const areaY = this.areaY;
    const trackTop = areaY + RULER_HEIGHT;
    const trackArea = Math.max(8, this.areaHeight - RULER_HEIGHT);
    const trackHeight = Math.min(MAX_TRACK_HEIGHT, trackArea / Math.max(1, view.plan.units.length));
    const selected = view.selectedUnitId;

    this.timelineGraphics.lineStyle(1, 0x3a4a42, 0.9);
    this.timelineGraphics.lineBetween(areaX, areaY + RULER_HEIGHT, areaX + areaWidth, areaY + RULER_HEIGHT);

    const step = rulerStep(duration);

    for (let time = 0; time <= duration; time += step) {
      const x = areaX + (time / duration) * areaWidth;
      this.timelineGraphics.lineStyle(1, 0x3a4a42, 0.7);
      this.timelineGraphics.lineBetween(x, areaY + RULER_HEIGHT - 5, x, areaY + RULER_HEIGHT);

      const label = this.scene.add
        .text(x, areaY, `${(time / 1000).toFixed(1)}s`, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#6c7d72',
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(21);
      this.rulerLabels.push(label);
      this.dynamicLabels.push(label);
    }

    view.plan.units.forEach((unitPlan, index) => {
      const unit = view.state.units.find((candidate) => candidate.id === unitPlan.unitId);
      const label = unit ? UNIT_DEFS[unit.kind].label : 'Jednostka';
      const y = trackTop + index * trackHeight;
      const isSelected = selected === unitPlan.unitId;
      const moves = unitPlan.actions.filter((action) => action.kind === 'move').length;
      const attacks = unitPlan.actions.filter((action) => action.kind === 'attack').length;

      this.timelineGraphics.fillStyle(TRACK_BACKGROUND, 0.55);
      this.timelineGraphics.fillRect(areaX, y, areaWidth, Math.max(2, trackHeight - 4));

      const text = this.scene.add
        .text(12, y + 1, `${index + 1}. ${label} · ${moves}R ${attacks}A`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: isSelected ? '#f2d35c' : '#d8e2dc',
        })
        .setScrollFactor(0)
        .setDepth(21);
      this.trackLabels.push(text);
      this.dynamicLabels.push(text);

      for (const clip of view.timeline.clips) {
        if (clip.unitId !== unitPlan.unitId) {
          continue;
        }

        const x = areaX + (clip.startMs / duration) * areaWidth;
        const clipWidth = Math.max(3, ((clip.endMs - clip.startMs) / duration) * areaWidth);
        const clipHeight = Math.max(4, trackHeight - 8);

        this.timelineGraphics.fillStyle(clipColor(clip), isSelected ? 1 : 0.8);
        this.timelineGraphics.fillRoundedRect(x, y + 2, clipWidth, clipHeight, 3);

        if (isSelected) {
          this.timelineGraphics.lineStyle(1, 0xffffff, 0.8);
          this.timelineGraphics.strokeRoundedRect(x, y + 2, clipWidth, clipHeight, 3);
        }
      }
    });

    this.drawPlayhead();
  }

  private drawPlayhead(): void {
    this.playheadGraphics.clear();

    const view = this.view;

    if (!view || this.collapsed) {
      return;
    }

    const duration = view.timeline.durationMs;

    if (duration <= 0) {
      return;
    }

    const x = this.areaX + (Math.min(this.timeMs, duration) / duration) * this.areaWidth;

    this.playheadGraphics.lineStyle(2, PLAYHEAD_COLOR, 0.95);
    this.playheadGraphics.lineBetween(x, this.areaY, x, this.areaY + this.areaHeight);
  }

  private register<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.objects.push(object);

    return object;
  }
}
