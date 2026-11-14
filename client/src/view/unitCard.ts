import Phaser from 'phaser';
import { canMoveNow, terrainAt, toDoubled } from '../core/map';
import type { PlanAction } from '../core/plan';
import type { GameState } from '../core/state';
import { TERRAIN_DEFS } from '../core/map/terrain';
import { FACTION_DEFS, shotsLeft, UNIT_DEFS, type Unit } from '../core/units';
import { formatPoints, formatRange } from './format';
import { unitTexture } from './unitLayer';

const WIDTH = 306;
const HEIGHT = 150;
const PADDING = 12;
const DEPTH = 24;
const FACTION_THEME_ACCENT = 0x6fd08c;

export interface UnitCardState {
  readonly selected: Unit | null;
  readonly state: GameState;
  readonly planActions?: readonly PlanAction[];
}

export class UnitCard {
  private readonly objects: (
    Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible
  )[] = [];
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly portrait: Phaser.GameObjects.Image;
  private readonly name: Phaser.GameObjects.Text;
  private readonly stats: Phaser.GameObjects.Text;
  private readonly ranges: Phaser.GameObjects.Text;
  private readonly meta: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    const x = 16;
    const y = 88;

    this.panel = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.panel.fillStyle(0x0b0f14, 0.92);
    this.panel.fillRoundedRect(x, y, WIDTH, HEIGHT, 8);
    this.panel.lineStyle(1, FACTION_THEME_ACCENT, 0.65);
    this.panel.strokeRoundedRect(x, y, WIDTH, HEIGHT, 8);
    this.panel.fillStyle(FACTION_THEME_ACCENT, 0.9);
    this.panel.fillRect(x, y + 10, 3, HEIGHT - 20);

    this.portrait = scene.add
      .image(x + PADDING + 36, y + 54, unitTexture(scene, 'infantry', 'blue').key)
      .setDisplaySize(64, 64)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.name = scene.add
      .text(x + PADDING + 84, y + 12, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f2f5f7',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.stats = scene.add
      .text(x + PADDING + 84, y + 32, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d8e2dc',
        wordWrap: { width: WIDTH - 108 },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.ranges = scene.add
      .text(x + PADDING, y + 82, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.meta = scene.add
      .text(x + PADDING, y + 100, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9fb0a5',
        wordWrap: { width: WIDTH - PADDING * 2 },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.status = scene.add
      .text(x + PADDING, y + 120, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6fd08c',
        wordWrap: { width: WIDTH - PADDING * 2 },
      })
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);

    this.objects.push(
      this.panel,
      this.portrait,
      this.name,
      this.stats,
      this.ranges,
      this.meta,
      this.status,
    );
    this.hide();
  }

  get uiObjects(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  refresh({ selected, state, planActions = [] }: UnitCardState): void {
    if (!selected) {
      this.hide();
      return;
    }

    this.setVisible(true);

    const stats = UNIT_DEFS[selected.kind];
    const terrain = terrainAt(state.map, selected.pos);
    const doubled = toDoubled(selected.pos);
    const canMove = canMoveNow(state, selected);
    const ammo =
      stats.ammo !== undefined
        ? ` · POCISKI ${shotsLeft(selected)}/${stats.ammo}`
        : '';

    this.portrait.setTexture(unitTexture(this.scene, selected.kind, selected.faction).key);
    this.name
      .setText(`${stats.label} — ${FACTION_DEFS[selected.faction].label}`)
      .setColor('#f2f5f7');
    this.stats.setText(
      `HP ${selected.hp}/${stats.maxHp} · ATK ${stats.attack} · DEF ${stats.defense}${ammo}`,
    );
    this.ranges.setText(
      `Ruch ${formatPoints(canMove ? selected.movesLeft : 0)}/${stats.moveRange} · Wzrok ${formatRange(stats.visionRange)} · Strzał ${formatRange(stats.attackRange)}`,
    );
    this.meta.setText(
      `Teren: ${terrain ? TERRAIN_DEFS[terrain].label : 'pusto'} · Heks: ${doubled.col},${doubled.row}`,
    );

    const plannedMoves = planActions.filter((action) => action.kind === 'move').length;
    const plannedAttacks = planActions.filter((action) => action.kind === 'attack').length;
    const planLabel =
      planActions.length > 0
        ? `Plan: ${plannedMoves}× ruch, ${plannedAttacks}× atak · Del — usuń ostatnią`
        : null;

    this.status
      .setText(
        planLabel ??
          (selected.hasActed
            ? 'Działała — ruch w następnej turze'
            : !canMove
              ? 'Zablokowana — brak dostępnego ruchu'
              : `Gotowa — klik heks (trasa) albo wroga (atak) · ${formatPoints(selected.movesLeft)} pkt.`),
      )
      .setColor(planLabel ? '#f2d35c' : canMove ? '#6fd08c' : '#e0a15a');
  }

  private setVisible(visible: boolean): void {
    for (const object of this.objects) {
      object.setVisible(visible);
    }
  }

  private hide(): void {
    this.setVisible(false);
  }
}
