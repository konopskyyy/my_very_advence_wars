import Phaser from 'phaser';
import type { GameMap } from '../core/map';
import { drawMapPreview, previewLayout } from './mapPreview';

export interface MapCardOptions {
  readonly title: string;
  readonly description?: string;
  readonly meta?: string;
  readonly map?: GameMap;
  readonly previewSize?: number;
  readonly previewPadding?: number;
  readonly textWidth?: number;
  readonly minHeight?: number;
  readonly width?: number;
  readonly height?: number;
  readonly onOpen: () => void;
}

export interface MapCard {
  readonly container: Phaser.GameObjects.Container;
  readonly width: number;
  readonly height: number;
}

const CARD_FILL = 0x0b0f14;
const CARD_STROKE = 0x3d6b4f;
const TITLE_COLOR = '#ffffff';
const HOVER_COLOR = '#a6f4c5';
const MUTED_COLOR = '#9fb0a5';
const META_COLOR = '#7fa08b';
const TEXT_PADDING = 16;
const PREVIEW_PADDING = 8;
const PREVIEW_SIZE = 4;

export function createMapCard(scene: Phaser.Scene, options: MapCardOptions): MapCard {
  const container = scene.add.container(0, 0);
  const hasPreview = options.map !== undefined;
  const previewSize = options.previewSize ?? PREVIEW_SIZE;
  const padding = options.previewPadding ?? PREVIEW_PADDING;
  const textWidth = options.textWidth ?? (hasPreview ? 200 : 320);
  const layout = options.map
    ? previewLayout(options.map, previewSize, padding)
    : undefined;
  const width =
    options.width ??
    (layout ? layout.width + padding * 2 + textWidth + 20 : 360);
  const height =
    options.height ??
    (layout
      ? Math.max(layout.height + padding * 2, options.minHeight ?? 96)
      : options.description
        ? 64
        : 42);

  const background = scene.add.rectangle(0, 0, width, height, CARD_FILL, 0.85);

  background.setOrigin(0, 0);
  background.setStrokeStyle(1, CARD_STROKE, 1);
  background.setInteractive({ useHandCursor: true });
  container.add(background);

  if (options.map && layout) {
    const sprites = drawMapPreview(scene, options.map, previewSize, layout.origin);

    for (const sprite of sprites) {
      container.add(sprite);
    }
  }

  const textX = layout ? layout.width + padding * 2 : TEXT_PADDING;
  const titleY =
    hasPreview && options.meta
      ? 28
      : !hasPreview && options.meta && !options.description
        ? height / 2 - 8
        : height / 2 - 10;
  const title = scene.add
    .text(textX, titleY, options.title, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: TITLE_COLOR,
    })
    .setOrigin(0, 0.5);

  container.add(title);

  if (options.description) {
    const descriptionY = hasPreview ? 52 : height / 2 + 12;
    const description = scene.add
      .text(textX, descriptionY, options.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: MUTED_COLOR,
        wordWrap: { width: textWidth },
      })
      .setOrigin(0, hasPreview ? 0 : 0.5);

    container.add(description);
  }

  if (options.meta) {
    const metaY = hasPreview ? height - 16 : options.description ? height - 14 : height / 2 + 9;
    const meta = scene.add
      .text(textX, metaY, options.meta, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: META_COLOR,
        wordWrap: { width: textWidth },
      })
      .setOrigin(0, 0.5);

    container.add(meta);
  }

  background.on('pointerover', () => title.setColor(HOVER_COLOR));
  background.on('pointerout', () => title.setColor(TITLE_COLOR));
  background.on('pointerdown', options.onOpen);

  return { container, width, height };
}
