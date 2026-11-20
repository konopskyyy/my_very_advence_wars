import Phaser from 'phaser';
import {
  mapTileCount,
  terrainAt,
  toDoubled,
  type HexCoord,
} from '../core/map';
import type { ScenarioDefinition } from '../core/scenario';
import type { PlanAction } from '../core/plan';
import type { RecruitmentState } from '../core/recruitment';
import { countUnits, type GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/map/terrain';
import type { TurnState } from '../core/turn';
import {
  FACTION_DEFS,
  UNIT_DEFS,
  type FactionId,
  type Unit,
  type UnitKind,
} from '../core/units';
import { visibleUnitAt, type VisionPoint } from '../core/vision';
import { FACTION_THEMES, type FactionTheme } from './factionTheme';
import { UnitCard } from './unitCard';
import { BAR_PADDING, BAR_WIDTH } from './hudLayout';
import { unitTexture } from './unitLayer';

const CONTENT_WIDTH = BAR_WIDTH - BAR_PADDING * 2;
const BUTTON_HEIGHT = 36;
const BUTTON_GAP = 8;
const BUTTONS_Y_FROM_BOTTOM = 330;
const HUD_DIVIDER_Y_FROM_BOTTOM = 150;
const HUD_Y_FROM_BOTTOM = 138;
const TURN_Y_FROM_BOTTOM = 76;
const END_TURN_Y_FROM_BOTTOM = 54;
const END_TURN_HEIGHT = 44;

export interface ScenarioBarState {
  readonly scenario: ScenarioDefinition;
  readonly state: GameState;
  readonly turn: TurnState;
  readonly hover: HexCoord | null;
  readonly funds?: number;
  readonly recruitKind?: UnitKind;
  readonly vision?: VisionPoint;
  readonly recruitment?: RecruitmentState;
}

export interface ScenarioUnitState {
  readonly selected: Unit | null;
  readonly state: GameState;
  readonly planActions?: readonly PlanAction[];
}

export interface ScenarioCommandBarHandlers {
  readonly onEndTurn: () => void;
  readonly onRecruit: () => void;
  readonly onLog: () => void;
  readonly onObjectives: () => void;
  readonly onAirstrike: () => void;
  readonly onPauseMenu: () => void;
}

export class ScenarioCommandBar {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly bar: Phaser.GameObjects.Rectangle;
  private readonly barStripe: Phaser.GameObjects.Rectangle;
  private readonly barSeparators: Phaser.GameObjects.Rectangle[] = [];
  private readonly logButton: Phaser.GameObjects.Rectangle;
  private readonly logLabel: Phaser.GameObjects.Text;
  private readonly objectivesButton: Phaser.GameObjects.Rectangle;
  private readonly airstrikeButton: Phaser.GameObjects.Rectangle;
  private readonly recruitButton: Phaser.GameObjects.Rectangle;
  private readonly recruitIcon: Phaser.GameObjects.Image;
  private readonly recruitLabel: Phaser.GameObjects.Text;
  private readonly recruitPrice: Phaser.GameObjects.Text;
  private readonly endTurnButton: Phaser.GameObjects.Rectangle;
  private readonly barTurnLabel: Phaser.GameObjects.Text;
  private readonly hud: Phaser.GameObjects.Text;
  private readonly pauseMenuButton: Phaser.GameObjects.Rectangle;
  private readonly pauseMenuLabel: Phaser.GameObjects.Text;
  private readonly unitCard: UnitCard;
  private theme: FactionTheme = FACTION_THEMES.blue;
  private recruitKind: UnitKind = 'infantry';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: ScenarioCommandBarHandlers,
  ) {
    const barX = this.scene.scale.width - BAR_WIDTH;
    const height = this.scene.scale.height;
    const buttonsY = height - BUTTONS_Y_FROM_BOTTOM;
    const theme = FACTION_THEMES.blue;

    this.bar = this.register(
      this.scene.add
        .rectangle(barX, 0, BAR_WIDTH, height, theme.barBackground, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20),
    );
    this.bar.setStrokeStyle(1, theme.accent, 1);

    this.barStripe = this.register(
      this.scene.add
        .rectangle(barX, 0, 2, height, theme.accent, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.hud = this.register(
      this.scene.add
        .text(barX + BAR_PADDING, height - HUD_Y_FROM_BOTTOM, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#9fb0a5',
          lineSpacing: 2,
          wordWrap: { width: CONTENT_WIDTH },
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.barSeparators.push(
      this.register(
        this.scene.add
          .rectangle(
            barX + BAR_PADDING,
            height - HUD_DIVIDER_Y_FROM_BOTTOM,
            CONTENT_WIDTH,
            1,
            theme.divider,
            1,
          )
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(21),
      ),
    );

    this.logButton = this.makeBarButton({
      label: '',
      x: barX + BAR_PADDING,
      y: buttonsY,
      width: CONTENT_WIDTH,
      height: BUTTON_HEIGHT,
      action: this.handlers.onLog,
    });
    this.logLabel = this.register(
      this.scene.add
        .text(
          barX + BAR_PADDING + CONTENT_WIDTH / 2,
          buttonsY + BUTTON_HEIGHT / 2,
          'DZIENNIK',
          {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: theme.accentSoft,
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.objectivesButton = this.makeBarButton({
      label: 'CELE',
      x: barX + BAR_PADDING,
      y: buttonsY + BUTTON_HEIGHT + BUTTON_GAP,
      width: CONTENT_WIDTH,
      height: BUTTON_HEIGHT,
      action: this.handlers.onObjectives,
    });

    this.airstrikeButton = this.makeBarButton({
      label: 'NALOT',
      x: barX + BAR_PADDING,
      y: buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 2,
      width: CONTENT_WIDTH,
      height: BUTTON_HEIGHT,
      action: this.handlers.onAirstrike,
    });

    const recruitY = buttonsY + (BUTTON_HEIGHT + BUTTON_GAP) * 3;

    this.recruitButton = this.register(
      this.scene.add
        .rectangle(
          barX + BAR_PADDING,
          recruitY,
          CONTENT_WIDTH,
          BUTTON_HEIGHT,
          theme.accentDark,
          1,
        )
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.recruitIcon = this.register(
      this.scene.add
        .image(barX + BAR_PADDING + 24, recruitY + BUTTON_HEIGHT / 2, unitTexture(this.scene, 'infantry', 'blue').key)
        .setDisplaySize(26, 26)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitLabel = this.register(
      this.scene.add
        .text(barX + BAR_PADDING + CONTENT_WIDTH / 2 + 10, recruitY + 8, 'KUP', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: theme.accentSoft,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitPrice = this.register(
      this.scene.add
        .text(barX + BAR_PADDING + CONTENT_WIDTH / 2 + 10, recruitY + 24, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: theme.accentSoft,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitButton.on('pointerover', () =>
      this.recruitButton.setFillStyle(this.theme.accent, 1),
    );
    this.recruitButton.on('pointerout', () =>
      this.recruitButton.setFillStyle(this.theme.accentDark, 1),
    );
    this.recruitButton.on('pointerup', this.handlers.onRecruit);

    this.barTurnLabel = this.register(
      this.scene.add
        .text(barX + BAR_PADDING, height - TURN_Y_FROM_BOTTOM, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: theme.accentSoft,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.endTurnButton = this.makeBarButton({
      label: 'WYKONAJ TURĘ',
      x: barX + BAR_PADDING,
      y: height - END_TURN_Y_FROM_BOTTOM,
      width: CONTENT_WIDTH,
      height: END_TURN_HEIGHT,
      action: this.handlers.onEndTurn,
    });

    this.pauseMenuButton = this.makeBarButton({
      label: '',
      x: 16,
      y: 14,
      width: 132,
      height: 28,
      action: this.handlers.onPauseMenu,
    });
    this.pauseMenuLabel = this.register(
      this.scene.add
        .text(16 + 132 / 2, 14 + 28 / 2, 'MENU PAUZY', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitCard = new UnitCard(this.scene);
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [...this.objects, ...this.unitCard.uiObjects];
  }

  setVisible(visible: boolean): void {
    for (const object of this.uiObjects) {
      if ('setVisible' in object) {
        (object as Phaser.GameObjects.GameObject & { setVisible: (value: boolean) => void }).setVisible(visible);
      }
    }
  }

  setPauseMenuVisible(visible: boolean): void {
    this.pauseMenuButton.setVisible(visible);
    this.pauseMenuLabel.setVisible(visible);

    if (visible) {
      this.pauseMenuButton.setInteractive({ useHandCursor: true });
    } else {
      this.pauseMenuButton.disableInteractive();
    }
  }

  setLogAvailability(available: boolean): void {
    this.logButton.setAlpha(available ? 1 : 0.5);
    this.logLabel.setAlpha(available ? 1 : 0.5);
  }

  setAirstrikeAvailability(available: boolean): void {
    this.airstrikeButton.setAlpha(available ? 1 : 0.4);

    if (available) {
      this.airstrikeButton.setInteractive({ useHandCursor: true });
    } else {
      this.airstrikeButton.disableInteractive();
    }
  }

  refreshScenario({ state, turn, hover, funds, recruitKind, vision, recruitment }: ScenarioBarState): void {
    this.applyTheme(turn.faction);
    this.setAirstrikeAvailability(Boolean(recruitment?.purchased.bomber));

    if (recruitKind) {
      this.recruitKind = recruitKind;
    }

    this.recruitIcon.setTexture(unitTexture(this.scene, this.recruitKind, turn.faction).key);
    this.recruitPrice.setText(`${UNIT_DEFS[this.recruitKind].cost}`);

    const counts = countUnits(state.units);
    const terrain = hover ? terrainAt(state.map, hover) : undefined;
    const doubled = hover ? toDoubled(hover) : null;
    const hoverUnit = hover ? visibleUnitAt(state, hover, turn.faction, vision) : undefined;
    const parts = [
      `Jedn. ${counts.blue}/${counts.red}`,
      `Kafle ${mapTileCount(state.map)}`,
      `Mgła ${state.map.fogOfWar ? 'wł.' : 'wył.'}`,
      `Kredyty ${funds ?? 0}`,
    ];

    if (doubled && terrain) {
      const unitLabel = hoverUnit
        ? ` · ${FACTION_DEFS[hoverUnit.faction].label} ${UNIT_DEFS[hoverUnit.kind].label} HP ${hoverUnit.hp}`
        : '';
      const cost = TERRAIN_DEFS[terrain].moveCost >= 99 ? 'blokada' : `${TERRAIN_DEFS[terrain].moveCost}`;
      parts.push(`Heks ${doubled.col},${doubled.row} ${TERRAIN_DEFS[terrain].label} (${cost})${unitLabel}`);
    } else {
      parts.push('Heks —');
    }

    this.hud.setText(parts.map((part) => truncate(part, 20)).join('\n'));
    this.barTurnLabel.setText(`Tura ${turn.turn} — ${FACTION_DEFS[turn.faction].label}`);
  }

  refreshUnit(state: ScenarioUnitState): void {
    this.unitCard.refresh(state);
  }

  private register<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.objects.push(object);

    return object;
  }

  private applyTheme(faction: FactionId): void {
    const theme = FACTION_THEMES[faction];

    if (this.theme === theme) {
      return;
    }

    this.theme = theme;
    this.bar.setFillStyle(theme.barBackground, 0.94);
    this.bar.setStrokeStyle(1, theme.accent, 1);
    this.barStripe.setFillStyle(theme.accent, 1);

    for (const separator of this.barSeparators) {
      separator.setFillStyle(theme.divider, 1);
    }

    this.logButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.logLabel.setColor(theme.accentSoft);
    this.objectivesButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.airstrikeButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.recruitButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.recruitIcon.setTexture(unitTexture(this.scene, this.recruitKind, faction).key);
    this.recruitLabel.setColor(theme.accentSoft);
    this.recruitPrice.setColor(theme.accentSoft);
    this.endTurnButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.barTurnLabel.setColor(theme.accentSoft);
  }

  private makeBarButton(options: {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    action: () => void;
    trigger?: 'pointerdown' | 'pointerup';
  }): Phaser.GameObjects.Rectangle {
    const { label, x, y, width, height, action, trigger = 'pointerdown' } = options;
    const background = this.register(
      this.scene.add
        .rectangle(x, y, width, height, this.theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, this.theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    if (label) {
      this.register(
        this.scene.add
          .text(x + width / 2, y + height / 2, label, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(22),
      );
    }

    background.on('pointerover', () => background.setFillStyle(this.theme.accent, 1));
    background.on('pointerout', () => background.setFillStyle(this.theme.accentDark, 1));
    background.on(trigger, action);

    return background;
  }
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
