import Phaser from 'phaser';

const CHORD_SECONDS = 8;
const VOLUME = 0.045;

const PROGRESSION: readonly (readonly number[])[] = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
const BELL_SCALE = [69, 72, 74, 76, 79];

function frequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export class MenuMusic {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private chord = 0;
  private timer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    context: AudioContext,
  ) {
    this.context = context;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(filter).connect(context.destination);
  }

  static create(scene: Phaser.Scene): MenuMusic | null {
    const manager = scene.sound;
    if (!('context' in manager)) {
      return null;
    }

    return new MenuMusic(scene, manager.context);
  }

  start(): void {
    void this.context.resume();
    this.master.gain.setTargetAtTime(VOLUME, this.context.currentTime, 1.5);
    this.playChord();
    this.timer = this.scene.time.addEvent({
      delay: CHORD_SECONDS * 1000,
      loop: true,
      callback: () => this.playChord(),
    });
  }

  stop(): void {
    this.timer?.remove();
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.4);
    window.setTimeout(() => this.master.disconnect(), 2500);
  }

  private playChord(): void {
    const chord = PROGRESSION[this.chord % PROGRESSION.length] ?? [];
    this.chord += 1;
    const now = this.context.currentTime;

    for (const note of chord) {
      this.voice(frequency(note), 'triangle', now, CHORD_SECONDS + 3, 0.5, 2.5);
    }
    const root = chord[0];
    if (root !== undefined) {
      this.voice(frequency(root - 12), 'sine', now, CHORD_SECONDS + 3, 0.7, 2.5);
    }

    for (let i = 0; i < 2; i += 1) {
      const bell = BELL_SCALE[Math.floor(Math.random() * BELL_SCALE.length)];
      if (bell !== undefined) {
        this.voice(frequency(bell), 'sine', now + 1.5 + i * 3.5 + Math.random(), 3.5, 0.18, 0.05);
      }
    }
  }

  private voice(
    freq: number,
    type: OscillatorType,
    start: number,
    length: number,
    level: number,
    attack: number,
  ): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + attack);
    gain.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(gain).connect(this.master);
    osc.start(start);
    osc.stop(start + length + 0.1);
  }
}
