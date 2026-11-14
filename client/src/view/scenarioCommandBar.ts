import Phaser from 'phaser';
import {
  mapTileCount,
  terrainAt,
  toDoubled,
  type HexCoord,
} from '../core/map';
import type { ScenarioDefinition } from '../core/scenario';
import type { PlanAction } from '../core/plan';
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
import { BAR_HEIGHT, TURN_COLUMN_X } from './hudLayout';
import { unitTexture } from './unitLayer';

const LOG_X = 806;
const LOG_WIDTH = 92;
const RECRUIT_X = 908;
const RECRUIT_WIDTH = 92;
const BUTTON_Y = 10;
const BUTTON_HEIGHT = 44;

export interface ScenarioBarState {
  readonly scenario: ScenarioDefinition;
  readonly state: GameState;
  readonly turn: TurnState;
  readonly hover: HexCoord | null;
  readonly funds?: number;
  readonly recruitKind?: UnitKind;
  readonly vision?: VisionPoint;
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
  readonly onScenarioMenu: () => void;
  readonly onMainMenu: () => void;
}

export class ScenarioCommandBar {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly bar: Phaser.GameObjects.Rectangle;
  private readonly barStripe: Phaser.GameObjects.Rectangle;
  private readonly barSeparators: Phaser.GameObjects.Rectangle[] = [];
  private readonly logButton: Phaser.GameObjects.Rectangle;
  private readonly logLabel: Phaser.GameObjects.Text;
  private readonly recruitButton: Phaser.GameObjects.Rectangle;
  private readonly recruitIcon: Phaser.GameObjects.Image;
  private readonly recruitLabel: Phaser.GameObjects.Text;
  private readonly recruitPrice: Phaser.GameObjects.Text;
  private readonly endTurnButton: Phaser.GameObjects.Rectangle;
  private readonly barTurnLabel: Phaser.GameObjects.Text;
  private readonly scenarioName: Phaser.GameObjects.Text;
  private readonly hud: Phaser.GameObjects.Text;
  private readonly unitCard: UnitCard;
  private theme: FactionTheme = FACTION_THEMES.blue;
  private recruitKind: UnitKind = 'infantry';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: ScenarioCommandBarHandlers,
  ) {
    const barY = this.scene.scale.height - BAR_HEIGHT;
    const theme = FACTION_THEMES.blue;

    this.bar = this.register(
      this.scene.add
        .rectangle(0, barY, this.scene.scale.width, BAR_HEIGHT, theme.barBackground, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20),
    );
    this.bar.setStrokeStyle(1, theme.accent, 1);

    this.barStripe = this.register(
      this.scene.add
        .rectangle(0, barY, this.scene.scale.width, 2, theme.accent, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    this.makeBarLink('MENU SCENARIUSZY', 16, 14, this.handlers.onScenarioMenu);
    this.makeBarLink('MENU GŁÓWNE', 16, 32, this.handlers.onMainMenu);

    this.barTurnLabel = this.register(
      this.scene.add
        .text(16, barY + 8, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: theme.accentSoft,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.scenarioName = this.register(
      this.scene.add
        .text(16, barY + 26, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.hud = this.register(
      this.scene.add
        .text(16, barY + 44, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.barSeparators.push(
      this.register(
        this.scene.add
          .rectangle(LOG_X - 12, barY + 12, 1, BAR_HEIGHT - 24, theme.divider, 1)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(21),
      ),
    );

    this.logButton = this.makeBarButton(
      '',
      LOG_X,
      barY + BUTTON_Y,
      LOG_WIDTH,
      BUTTON_HEIGHT,
      this.handlers.onLog,
    );
    this.logLabel = this.register(
      this.scene.add
        .text(LOG_X + LOG_WIDTH / 2, barY + BUTTON_Y + BUTTON_HEIGHT / 2, 'DZIENNIK', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitButton = this.register(
      this.scene.add
        .rectangle(RECRUIT_X, barY + BUTTON_Y, RECRUIT_WIDTH, BUTTON_HEIGHT, theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.recruitIcon = this.register(
      this.scene.add
        .image(RECRUIT_X + 20, barY + BUTTON_Y + 22, unitTexture(this.scene, 'infantry', 'blue').key)
        .setDisplaySize(28, 28)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitLabel = this.register(
      this.scene.add
        .text(RECRUIT_X + 58, barY + BUTTON_Y + 14, 'KUP', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitPrice = this.register(
      this.scene.add
        .text(RECRUIT_X + 58, barY + BUTTON_Y + 30, '', {
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

    const turnWidth = this.scene.scale.width - TURN_COLUMN_X - 16;

    this.endTurnButton = this.makeBarButton(
      'WYKONAJ TURĘ',
      TURN_COLUMN_X,
      barY + BUTTON_Y,
      turnWidth,
      BUTTON_HEIGHT,
      this.handlers.onEndTurn,
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

  setLogAvailability(available: boolean): void {
    this.logButton.setAlpha(available ? 1 : 0.5);
    this.logLabel.setAlpha(available ? 1 : 0.5);
  }

  refreshScenario({ scenario, state, turn, hover, funds, recruitKind, vision }: ScenarioBarState): void {
    this.applyTheme(turn.faction);

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

    this.scenarioName.setText(truncate(scenario.name, 42));
    this.hud.setText(truncate(parts.join(' · '), 128));
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

  private makeBarLink(
    label: string,
    x: number,
    y: number,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const link = this.register(
      this.scene.add
        .text(x, y, label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22)
        .setInteractive({ useHandCursor: true }),
    );

    link.on('pointerover', () => link.setColor(this.theme.accentSoft));
    link.on('pointerout', () => link.setColor('#9fb0a5'));
    link.on('pointerdown', action);

    return link;
  }

  private makeBarButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    action: () => void,
    trigger: 'pointerdown' | 'pointerup' = 'pointerdown',
  ): Phaser.GameObjects.Rectangle {
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
