import Phaser from 'phaser';
import { mapTileCount, terrainAt, toDoubled, type HexCoord } from '../core/map';
import type { ScenarioDefinition } from '../core/scenario';
import { countUnits, findUnitAt, type GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/terrain';
import { isActiveFaction, type TurnState } from '../core/turn';
import { FACTION_DEFS, UNIT_DEFS, type Unit } from '../core/units';
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
  readonly onScenarioMenu: () => void;
  readonly onMainMenu: () => void;
}

export class ScenarioCommandBar {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly bar: Phaser.GameObjects.Rectangle;
  private readonly barTurnLabel: Phaser.GameObjects.Text;
  private readonly scenarioName: Phaser.GameObjects.Text;
  private readonly preview: Phaser.GameObjects.Image;
  private readonly previewHint: Phaser.GameObjects.Text;
  private readonly unitName: Phaser.GameObjects.Text;
  private readonly unitStats: Phaser.GameObjects.Text;
  private readonly unitMeta: Phaser.GameObjects.Text;
  private readonly unitStatus: Phaser.GameObjects.Text;
  private readonly hud: Phaser.GameObjects.Text;
  private readonly factionText: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: ScenarioCommandBarHandlers,
  ) {
    const barY = this.scene.scale.height - BAR_HEIGHT;

    this.factionText = this.register(
      this.scene.add
        .text(this.scene.scale.width - 20, 20, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d8e2dc',
          align: 'right',
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(10),
    );

    this.bar = this.register(
      this.scene.add
        .rectangle(0, barY, this.scene.scale.width, BAR_HEIGHT, 0x0b0f14, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20),
    );
    this.bar.setStrokeStyle(1, 0x3d6b4f, 1);

    this.register(
      this.scene.add
        .rectangle(0, barY, this.scene.scale.width, 2, 0x3d6b4f, 1)
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
        .text(unitTextX, barY + 38, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d8e2dc',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitMeta = this.register(
      this.scene.add
        .text(unitTextX, barY + 60, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.unitStatus = this.register(
      this.scene.add
        .text(unitTextX, barY + 82, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6fd08c',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.register(
      this.scene.add
        .rectangle(404, barY + 16, 1, BAR_HEIGHT - 32, 0x2a3a31, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
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

    this.register(
      this.scene.add
        .rectangle(980, barY + 16, 1, BAR_HEIGHT - 32, 0x2a3a31, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21),
    );

    const turnX = 1010;
    const turnWidth = this.scene.scale.width - turnX - 16;

    this.makeBarButton('ZAKOŃCZ TURĘ', turnX, barY + 14, turnWidth, 42, this.handlers.onEndTurn);

    this.barTurnLabel = this.register(
      this.scene.add
        .text(turnX, barY + 62, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#9fb0a5',
        })
        .setScrollFactor(0)
        .setDepth(22),
    );

    this.register(
      this.scene.add
        .text(turnX, barY + 84, 'LPM — wybór/ruch · T — tura\nkółko — zoom · ESC — scenariusze', {
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

    if (hover) {
      const terrain = terrainAt(state.map, hover);
      const doubled = toDoubled(hover);
      const unit = findUnitAt(state, hover);
      const terrainLabel = terrain ? TERRAIN_DEFS[terrain].label : 'pusto';
      const moveCost = terrain ? TERRAIN_DEFS[terrain].moveCost : 1;
      const moveCostLabel = moveCost >= 99 ? 'ruch: blokada' : `ruch: ${moveCost}`;
      const unitLabel = unit
        ? ` · ${FACTION_DEFS[unit.faction].label} ${UNIT_DEFS[unit.kind].label}`
        : '';

      lines.push(`Heks: ${doubled.col},${doubled.row} — ${terrainLabel} · ${moveCostLabel}${unitLabel}`);
    } else {
      lines.push('Heks: —');
    }

    this.scenarioName.setText(
      scenario.name.length > 40 ? `${scenario.name.slice(0, 39)}…` : scenario.name,
    );
    this.hud.setText(lines.join('\n'));
    this.factionText.setText(factionLine(state, turn));
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
      this.unitMeta.setText('');
      this.unitStatus.setText('');
      return;
    }

    const current = findUnitAt(state, selected.pos) ?? selected;
    const stats = UNIT_DEFS[current.kind];
    const terrain = terrainAt(state.map, current.pos);
    const doubled = toDoubled(current.pos);

    this.preview
      .setTexture(unitTexture(this.scene, current.kind, current.faction).key)
      .setVisible(true);
    this.previewHint.setVisible(false);
    this.unitName
      .setText(`${stats.label} — ${FACTION_DEFS[current.faction].label}`)
      .setColor('#f2f5f7');
    this.unitStats.setText(
      `HP ${current.hp}/${stats.maxHp} · ATK ${stats.attack} · DEF ${stats.defense} · Ruch: ${current.movesLeft}/${stats.moveRange}`,
    );
    this.unitMeta.setText(
      `Teren: ${terrain ? TERRAIN_DEFS[terrain].label : 'pusto'} · Heks: ${doubled.col},${doubled.row}`,
    );
    this.unitStatus
      .setText(
        current.hasActed || current.movesLeft === 0
          ? 'Działała — ruch w następnej turze'
          : movePath && movePath.length > 0
            ? '1. klik — trasa · 2. klik — potwierdzenie ruchu'
            : `Gotowa — pozostało ${current.movesLeft} pkt. ruchu`,
      )
      .setColor(current.hasActed || current.movesLeft === 0 ? '#e0a15a' : '#6fd08c');
  }

  private register<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.objects.push(object);

    return object;
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

    link.on('pointerover', () => link.setColor('#a6f4c5'));
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
  ): Phaser.GameObjects.Text {
    const background = this.register(
      this.scene.add
        .rectangle(x, y, width, height, 0x1f6b45, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(21)
        .setStrokeStyle(1, 0x6fd08c, 0.8)
        .setInteractive({ useHandCursor: true }),
    );

    const text = this.register(
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

    background.on('pointerover', () => background.setFillStyle(0x2b8a5b, 1));
    background.on('pointerout', () => background.setFillStyle(0x1f6b45, 1));
    background.on('pointerdown', action);

    return text;
  }
}

function factionLine(state: GameState, turn: TurnState): string {
  const counts = countUnits(state.units);
  const blue = isActiveFaction(turn, 'blue') ? '▶ ' : '  ';
  const red = isActiveFaction(turn, 'red') ? '▶ ' : '  ';

  return `${blue}NIEBIESKA (${counts.blue})   ${red}CZERWONA (${counts.red})`;
}
