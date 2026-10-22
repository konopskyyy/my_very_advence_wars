export class FrameMeter {
  private frames = 0;
  private elapsed = 0;

  fps = 0;
  frameTime = 0;

  update(delta: number): void {
    this.frames += 1;
    this.elapsed += delta;
    this.frameTime = this.frameTime === 0 ? delta : this.frameTime * 0.85 + delta * 0.15;

    if (this.elapsed >= 500) {
      this.fps = (this.frames * 1000) / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
    }
  }
}
