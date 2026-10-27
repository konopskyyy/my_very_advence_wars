import Phaser from 'phaser';

export interface ScrollListOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly gap?: number;
  readonly wheelStep?: number;
}

interface ScrollRow {
  readonly container: Phaser.GameObjects.Container;
  readonly height: number;
  readonly top: number;
}

const SCROLLBAR_WIDTH = 4;
const SCROLLBAR_MIN_THUMB = 28;

export class ScrollList {
  readonly container: Phaser.GameObjects.Container;
  private readonly topCover: Phaser.GameObjects.Rectangle;
  private readonly bottomCover: Phaser.GameObjects.Rectangle;
  private readonly scrollbar: Phaser.GameObjects.Graphics;
  private readonly rows: ScrollRow[] = [];
  private readonly gap: number;
  private readonly wheelStep: number;
  private nextTop = 0;
  private scrollY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ScrollListOptions,
  ) {
    this.gap = options.gap ?? 10;
    this.wheelStep = options.wheelStep ?? 64;
    this.container = scene.add.container(options.x, options.y);
    this.topCover = this.createCover(0, 0, scene.scale.width, options.y);
    this.bottomCover = this.createCover(
      0,
      options.y + options.height,
      scene.scale.width,
      scene.scale.height - options.y - options.height,
    );
    this.scrollbar = scene.add.graphics();
    this.scrollbar.setDepth(20);

    scene.input.on('wheel', this.onWheel, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get contentHeight(): number {
    return this.rows.length === 0 ? 0 : this.nextTop - this.gap;
  }

  get viewportHeight(): number {
    return this.options.height;
  }

  addRow(container: Phaser.GameObjects.Container, height: number, x = 0): void {
    container.setPosition(x, this.nextTop);
    this.container.add(container);
    this.rows.push({ container, height, top: this.nextTop });
    this.nextTop += height + this.gap;
    this.refresh();
  }

  clear(): void {
    for (const row of this.rows) {
      row.container.destroy();
    }

    this.rows.length = 0;
    this.nextTop = 0;
    this.scrollY = 0;
    this.refresh();
  }

  scrollBy(amount: number): void {
    const maxScroll = Math.max(0, this.contentHeight - this.options.height);

    this.scrollY = Phaser.Math.Clamp(this.scrollY + amount, 0, maxScroll);
    this.refresh();
  }

  destroy(): void {
    this.scene.input.off('wheel', this.onWheel, this);
    this.container.destroy();
    this.topCover.destroy();
    this.bottomCover.destroy();
    this.scrollbar.destroy();
    this.rows.length = 0;
  }

  private createCover(
    x: number,
    y: number,
    width: number,
    height: number,
  ): Phaser.GameObjects.Rectangle {
    const cover = this.scene.add.rectangle(x, y, width, height, 0x0b0b0b, 1);

    cover.setOrigin(0, 0);
    cover.setDepth(5);
    cover.setScrollFactor(0);

    return cover;
  }

  private onWheel(
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.contains(pointer.x, pointer.y) || this.contentHeight <= this.options.height) {
      return;
    }

    this.scrollBy(deltaY > 0 ? this.wheelStep : -this.wheelStep);
  }

  private contains(x: number, y: number): boolean {
    return (
      x >= this.options.x &&
      x <= this.options.x + this.options.width &&
      y >= this.options.y &&
      y <= this.options.y + this.options.height
    );
  }

  private refresh(): void {
    const maxScroll = Math.max(0, this.contentHeight - this.options.height);

    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, maxScroll);
    this.container.setY(this.options.y - this.scrollY);

    for (const row of this.rows) {
      const top = row.top - this.scrollY;
      row.container.setVisible(top < this.options.height && top + row.height > 0);
    }

    this.drawScrollbar(maxScroll);
  }

  private drawScrollbar(maxScroll: number): void {
    this.scrollbar.clear();

    if (maxScroll <= 0) {
      return;
    }

    const x = this.options.x + this.options.width - SCROLLBAR_WIDTH;
    const trackHeight = this.options.height;
    const thumbHeight = Math.max(
      SCROLLBAR_MIN_THUMB,
      (this.options.height * this.options.height) / this.contentHeight,
    );
    const thumbY =
      this.options.y + (this.scrollY / maxScroll) * (trackHeight - thumbHeight);

    this.scrollbar.fillStyle(0x1b2a21, 0.9);
    this.scrollbar.fillRect(x, this.options.y, SCROLLBAR_WIDTH, trackHeight);
    this.scrollbar.fillStyle(0x6fbf8f, 0.9);
    this.scrollbar.fillRect(x, thumbY, SCROLLBAR_WIDTH, thumbHeight);
  }
}
