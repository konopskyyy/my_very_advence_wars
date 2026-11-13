import Phaser from 'phaser';
import { hexCorners } from '../core/map';
import type { FactionId } from '../core/units';
import { FACTION_THEMES } from './factionTheme';
import { tracePolygon } from './hexGrid';

const DEPTH = 1;

export class SpawnPointView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    center: { x: number; y: number },
    size: number,
    faction: FactionId,
  ) {
    const theme = FACTION_THEMES[faction];

    this.graphics = scene.add.graphics().setDepth(DEPTH);

    const corners = hexCorners(center, size * 0.9);

    this.graphics.fillStyle(theme.accent, 0.22);
    tracePolygon(this.graphics, corners);
    this.graphics.fillPath();

    this.graphics.lineStyle(3, theme.accentBright, 0.95);
    tracePolygon(this.graphics, corners);
    this.graphics.strokePath();

    this.graphics.lineStyle(2, theme.accent, 0.9);
    this.graphics.strokeCircle(center.x, center.y, size * 0.42);

    const mastTop = center.y - size * 0.55;
    this.graphics.lineStyle(2, theme.accentBright, 1);
    this.graphics.lineBetween(center.x, center.y + size * 0.28, center.x, mastTop);

    this.graphics.fillStyle(theme.accentBright, 1);
    this.graphics.fillTriangle(
      center.x,
      mastTop,
      center.x + size * 0.44,
      mastTop + size * 0.15,
      center.x,
      mastTop + size * 0.3,
    );

    this.label = scene.add
      .text(center.x, center.y - size * 1.05, 'BAZA', {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: theme.accentSoft,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH);
  }

  get objects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.graphics, this.label];
  }
}
