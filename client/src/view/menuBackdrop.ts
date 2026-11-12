import Phaser from 'phaser';
import { FACTION_THEMES } from './factionTheme';
import { tracePolygon } from './hexGrid';

const HEX_RADIUS = 34;
const SQRT3 = Math.sqrt(3);

function hexPoints(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

export function drawMenuBackdrop(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const blue = FACTION_THEMES.blue;
  const red = FACTION_THEMES.red;

  const sky = scene.add.graphics();
  sky.fillGradientStyle(0x0b1220, 0x0b1220, 0x090b10, 0x090b10, 1);
  sky.fillRect(0, 0, width, height);

  const grid = scene.add.graphics();
  const front = scene.add.graphics();
  const stepX = HEX_RADIUS * 1.5;
  const stepY = HEX_RADIUS * SQRT3;

  for (let col = -1; col * stepX < width + HEX_RADIUS; col += 1) {
    for (let row = -1; row * stepY < height + stepY; row += 1) {
      const cx = col * stepX;
      const cy = row * stepY + (col % 2 === 0 ? 0 : stepY / 2);
      const t = cx / width;
      const points = hexPoints(cx, cy, HEX_RADIUS - 2);

      grid.lineStyle(1, 0x1c2638, 0.55);
      tracePolygon(grid, points);
      grid.strokePath();

      const leftness = 1 - t / 0.38;
      const rightness = (t - 0.62) / 0.38;
      const side = leftness > 0 ? 'blue' : rightness > 0 ? 'red' : null;
      const strength = Math.max(leftness, rightness);

      if (side && Math.sin(col * 12.9898 + row * 78.233) > 0.2 - strength * 0.9) {
        const theme = side === 'blue' ? blue : red;
        front.fillStyle(theme.accent, 0.1 + strength * 0.22);
        tracePolygon(front, points);
        front.fillPath();
        front.lineStyle(1, theme.accentBright, 0.25 + strength * 0.3);
        tracePolygon(front, points);
        front.strokePath();
      }
    }
  }

  scene.tweens.add({
    targets: front,
    alpha: { from: 0.55, to: 1 },
    duration: 2600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  const vignette = scene.add.graphics();
  vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0.55, 0, 0);
  vignette.fillRect(0, 0, width, height * 0.25);
  vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
  vignette.fillRect(0, height * 0.75, width, height * 0.25);
}

export function drawEmblem(scene: Phaser.Scene, x: number, y: number, radius: number): void {
  const blue = FACTION_THEMES.blue;
  const red = FACTION_THEMES.red;
  const g = scene.add.graphics();

  const outer = hexPoints(x, y, radius);
  g.fillStyle(0x0d1420, 1);
  tracePolygon(g, outer);
  g.fillPath();

  const topMid = { x, y: y - radius * 0.87 };
  const bottomMid = { x, y: y + radius * 0.87 };
  g.fillStyle(blue.accent, 1);
  tracePolygon(g, [topMid, outer[4]!, outer[3]!, outer[2]!, bottomMid]);
  g.fillPath();
  g.fillStyle(red.accent, 1);
  tracePolygon(g, [topMid, outer[5]!, outer[0]!, outer[1]!, bottomMid]);
  g.fillPath();

  const inner = hexPoints(x, y, radius * 0.55);
  g.fillStyle(0x0d1420, 1);
  tracePolygon(g, inner);
  g.fillPath();
  g.lineStyle(3, 0xe8eef5, 1);
  tracePolygon(g, outer);
  g.strokePath();
  g.lineStyle(2, 0xe8eef5, 0.9);
  tracePolygon(g, inner);
  g.strokePath();

  g.fillStyle(0xe8eef5, 1);
  g.fillTriangle(x - radius * 0.22, y + radius * 0.2, x, y - radius * 0.28, x + radius * 0.22, y + radius * 0.2);
}
