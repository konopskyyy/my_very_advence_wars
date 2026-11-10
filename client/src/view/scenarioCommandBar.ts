import Phaser from 'phaser';
import {
  canMoveNow,
  findUnitAt,
  mapTileCount,
  terrainAt,
  toDoubled,
  type HexCoord,
} from '../core/map';
import type { ScenarioDefinition } from '../core/scenario';
import { countUnits, type GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/map/terrain';
import type { TurnState } from '../core/turn';
import { FACTION_DEFS, shotsLeft, UNIT_DEFS, type FactionId, type Unit } from '../core/units';
import { visibleUnitAt } from '../core/vision';
import { FACTION_THEMES, type FactionTheme } from './factionTheme';
import { formatPoints } from './format';
import { unitTexture } from './unitLayer';

export const BAR_HEIGHT = 116;

export interface ScenarioBarState {
  readonly scenario: ScenarioDefinition;
  readonly state: GameState;
  readonly turn: TurnState;
  readonly hover: HexCoord | null;
}

export interface ScenarioUnitState {
  readonly selected: Unit | null;
  readonly state: GameState;
  readonly movePath: HexCoord[] | null;
}

export interface ScenarioCommandBarHandlers {
  readonly onEndTurn: () => void;
  readonly onRecruit: () => void;
  readonly onScenarioMenu: () => void;
  readonly onMainMenu: () => void;
}

export class ScenarioCommandBar {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly bar: Phaser.GameObjects.Rectangle;
  private readonly barStripe: Phaser.GameObjects.Rectangle;
  private readonly barSeparators: Phaser.GameObjects.Rectangle[] = [];
  private readonly recruitButton: Phaser.GameObjects.Rectangle;
  private readonly recruitIcon: Phaser.GameObjects.Image;
  private readonly recruitLabel: Phaser.GameObjects.Text;
  private readonly endTurnButton: Phaser.GameObjects.Rectangle;
  private readonly barTurnLabel: Phaser.GameObjects.Text;
  private readonly scenarioName: Phaser.GameObjects.Text;
  private readonly preview: Phaser.GameObjects.Image;
  private readonly previewHint: Phaser.GameObjects.Text;
  private readonly unitName: Phaser.GameObjects.Text;
  private readonly unitStats: Phaser.GameObjects.Text;
  private readonly rangeLabel: Phaser.GameObjects.Text;
  private readonly moveRangeText: Phaser.GameObjects.Text;
  private readonly visionRangeText: Phaser.GameObjects.Text;
  private readonly attackRangeText: Phaser.GameObjects.Text;
  private readonly unitMeta: Phaser.GameObjects.Text;
  private readonly unitStatus: Phaser.GameObjects.Text;
  private readonly hud: Phaser.GameObjects.Text;
  private theme: FactionTheme = FACTION_THEMES.blue;

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

    this.preview = this.register(
      this.scene.add
        .image(
          52,
          barY + BAR_HEIGHT / 2,
          unitTexture(this.scene, 'infantry', 'blue').key,
        )
        .setScale(2.2)
        .setScrollFactor(0)
        .setDepth(22)
        .setVisible(false),
    );

    this.previewHint = this.register(
      this.scene.add
        .text(52, barY + BAR_HEIGHT / 2, 'BRAK\nWYBORU', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6c7d72',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    const unitTextX = 96;

    this.unitName = this.register(
      this.scene.add
        .text(unitTextX, barY + 12, '', {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitStats = this.register(
      this.scene.add
        .text(unitTextX, barY + 32, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d8e2dc',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    const rangeY = barY + 52;
    const rangeFont = { fontFamily: 'monospace', fontSize: '10px' };

    this.rangeLabel = this.register(
      this.scene.add
        .text(unitTextX, rangeY, 'Zasięgi:', { ...rangeFont, color: '#9fb0a5' })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.moveRangeText = this.register(
      this.scene.add
        .text(unitTextX + 54, rangeY, '', { ...rangeFont, color: '#6fd08c' })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.visionRangeText = this.register(
      this.scene.add
        .text(unitTextX + 108, rangeY, '', { ...rangeFont, color: '#5aa9e6' })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.attackRangeText = this.register(
      this.scene.add
        .text(unitTextX + 162, rangeY, '', { ...rangeFont, color: '#e0563f' })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitMeta = this.register(
      this.scene.add
        .text(unitTextX, barY + 70, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitStatus = this.register(
      this.scene.add
        .text(unitTextX, barY + 88, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6fd08c',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.barSeparators.push(
      this.register(
        this.scene.add
          .rectangle(404, barY + 16, 1, BAR_HEIGHT - 32, theme.divider, 1)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(21),
      ),
    );

    const scenarioX = 420;

    this.scenarioName = this.register(
      this.scene.add
        .text(scenarioX, barY + 10, '', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f2f5f7',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.hud = this.register(
      this.scene.add
        .text(scenarioX, barY + 32, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#d8e2dc',
          wordWrap: { width: 340 },
          lineSpacing: 2,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    const navX = 792;

    this.makeBarLink('MENU SCENARIUSZY', navX, barY + 20, this.handlers.onScenarioMenu);
    this.makeBarLink('MENU GŁÓWNE', navX, barY + 42, this.handlers.onMainMenu);
    this.recruitButton = this.register(
      this.scene.add
        .rectangle(930, barY + 14, 44, 88, theme.accentDark, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, theme.accentBright, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    this.recruitIcon = this.register(
      this.scene.add
        .image(952, barY + 48, unitTexture(this.scene, 'infantry', 'blue').key)
        .setScale(1.15)
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.recruitLabel = this.register(
      this.scene.add
        .text(952, barY + 76, 'KUP', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
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

    this.barSeparators.push(
      this.register(
        this.scene.add
          .rectangle(980, barY + 16, 1, BAR_HEIGHT - 32, theme.divider, 1)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(21),
      ),
    );

    const turnX = 1010;
    const turnWidth = this.scene.scale.width - turnX - 16;

    this.endTurnButton = this.makeBarButton(
      'ZAKOŃCZ TURĘ',
      turnX,
      barY + 14,
      turnWidth,
      42,
      this.handlers.onEndTurn,
    );

    this.barTurnLabel = this.register(
      this.scene.add
        .text(turnX, barY + 62, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: theme.accentSoft,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.register(
      this.scene.add
        .text(turnX, barY + 84, 'LPM — wybór/ruch/atak · T — tura\nkółko — zoom · ESC — scenariusze', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
          lineSpacing: 1,
        })
        .setScrollFactor(0)
        .setDepth(22),
    );
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  refreshScenario({ scenario, state, turn, hover }: ScenarioBarState): void {
    this.applyTheme(turn.faction);

    const counts = countUnits(state.units);
    const description = scenario.description.trim();
    const lines: string[] = [];

    if (description) {
      lines.push(
        description.length > 110 ? `${description.slice(0, 109)}…` : description,
      );
    }

    lines.push(
      `Jednostki: ${counts.blue} nieb. · ${counts.red} czerw. · Kafle: ${mapTileCount(state.map)}`,
    );
    lines.push(`Mgła wojny: ${state.map.fogOfWar ? 'włączona' : 'wyłączona'}`);

    if (hover) {
      const terrain = terrainAt(state.map, hover);
      const doubled = toDoubled(hover);
      const unit = visibleUnitAt(state, hover, turn.faction);
      const terrainLabel = terrain ? TERRAIN_DEFS[terrain].label : 'pusto';
      const moveCost = terrain ? TERRAIN_DEFS[terrain].moveCost : 1;
      const moveCostLabel = moveCost >= 99 ? 'ruch: blokada' : `ruch: ${moveCost}`;
      const unitLabel = unit
        ? ` · ${FACTION_DEFS[unit.faction].label} ${UNIT_DEFS[unit.kind].label} HP ${unit.hp}/${UNIT_DEFS[unit.kind].maxHp}`
        : '';

      lines.push(`Heks: ${doubled.col},${doubled.row} — ${terrainLabel} · ${moveCostLabel}${unitLabel}`);
    } else {
      lines.push('Heks: —');
    }

    this.scenarioName.setText(
      scenario.name.length > 40 ? `${scenario.name.slice(0, 39)}…` : scenario.name,
    );
    this.hud.setText(lines.join('\n'));
    this.barTurnLabel.setText(
      `Tura ${turn.turn} — ${FACTION_DEFS[turn.faction].label}`,
    );
  }

  refreshUnit({ selected, state, movePath }: ScenarioUnitState): void {
    if (!selected) {
      this.preview.setVisible(false);
      this.previewHint.setVisible(true);
      this.unitName.setText('Brak wybranej jednostki').setColor('#6c7d72');
      this.unitStats.setText('Kliknij jednostkę na mapie');
      this.rangeLabel.setText('');
      this.moveRangeText.setText('');
      this.visionRangeText.setText('');
      this.attackRangeText.setText('');
      this.unitMeta.setText('');
      this.unitStatus.setText('');
      return;
    }

    const current = findUnitAt(state, selected.pos) ?? selected;
    const stats = UNIT_DEFS[current.kind];
    const terrain = terrainAt(state.map, current.pos);
    const doubled = toDoubled(current.pos);

    const ammo =
      stats.ammo !== undefined
        ? ` · POCISKI ${shotsLeft(current)}/${stats.ammo}`
        : '';

    this.preview
      .setTexture(unitTexture(this.scene, current.kind, current.faction).key)
      .setVisible(true);
    this.previewHint.setVisible(false);
    this.unitName
      .setText(`${stats.label} — ${FACTION_DEFS[current.faction].label}`)
      .setColor('#f2f5f7');
    this.unitStats.setText(
      `HP ${current.hp}/${stats.maxHp} · ATK ${stats.attack} · DEF ${stats.defense}${ammo}`,
    );
    const canMove = canMoveNow(state, current);

    this.rangeLabel.setText('Zasięgi:');
    this.moveRangeText
      .setText(`Ruch ${formatPoints(canMove ? current.movesLeft : 0)}/${stats.moveRange}`)
      .setColor(canMove ? '#6fd08c' : '#9fb0a5');
    this.visionRangeText.setText(`Wzrok ${formatPoints(stats.visionRange)}`);
    this.attackRangeText.setText(`Strzał ${formatPoints(stats.attackRange)}`);
    this.unitMeta.setText(
      `Teren: ${terrain ? TERRAIN_DEFS[terrain].label : 'pusto'} · Heks: ${doubled.col},${doubled.row}`,
    );
    this.unitStatus
      .setText(
        current.hasActed
          ? 'Działała — ruch w następnej turze'
          : !canMove
            ? 'Zablokowana — brak dostępnego ruchu'
            : movePath && movePath.length > 0
              ? '1. klik — trasa · 2. klik — potwierdzenie ruchu'
              : `Gotowa — pozostało ${formatPoints(current.movesLeft)} pkt. ruchu`,
      )
      .setColor(canMove ? '#6fd08c' : '#e0a15a');
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

    this.recruitButton
      .setFillStyle(theme.accentDark, 1)
      .setStrokeStyle(1, theme.accentBright, 0.8);
    this.recruitIcon.setTexture(unitTexture(this.scene, 'infantry', faction).key);
    this.recruitLabel.setColor(theme.accentSoft);
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

    this.register(
      this.scene.add
        .text(x + width / 2, y + height / 2, label, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(22),
    );

    background.on('pointerover', () => background.setFillStyle(this.theme.accent, 1));
    background.on('pointerout', () => background.setFillStyle(this.theme.accentDark, 1));
    background.on(trigger, action);

    return background;
  }
}
