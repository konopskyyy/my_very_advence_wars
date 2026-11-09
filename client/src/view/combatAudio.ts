import clickUrl from '../assets/ai/audio/click.wav?url';
import deathUrl from '../assets/ai/audio/death.wav?url';
import hitUrl from '../assets/ai/audio/hit.wav?url';
import shotUrl from '../assets/ai/audio/shot.wav?url';
import stepUrl from '../assets/ai/audio/step.wav?url';
import type { SoundId } from '../core/sound';
import type { Weapon } from '../core/units';

interface SoundSource {
  readonly url: string;
  readonly volume: number;
}

interface SoundPool {
  readonly elements: HTMLAudioElement[];
  next: number;
}

const POOL_SIZE = 3;
const SOURCES: Record<SoundId, SoundSource> = {
  'rifle-shot': { url: shotUrl, volume: 0.6 },
  hit: { url: hitUrl, volume: 0.7 },
  step: { url: stepUrl, volume: 0.9 },
  click: { url: clickUrl, volume: 0.35 },
  death: { url: deathUrl, volume: 0.6 },
};
const pools = new Map<SoundId, SoundPool>();
let unlockInstalled = false;

function getPool(name: SoundId): SoundPool {
  const existing = pools.get(name);

  if (existing) {
    return existing;
  }

  const source = SOURCES[name];
  const elements = Array.from({ length: POOL_SIZE }, () => {
    const audio = new Audio(source.url);
    audio.preload = 'auto';
    audio.volume = source.volume;
    return audio;
  });
  const pool = { elements, next: 0 };
  pools.set(name, pool);
  return pool;
}

function prime(name: SoundId): void {
  const source = SOURCES[name];
  const pool = getPool(name);

  for (const audio of pool.elements) {
    audio.volume = 0;
    const playback = audio.play();

    if (playback) {
      void playback.catch(() => undefined);
    }

    audio.addEventListener('ended', () => {
      audio.volume = source.volume;
    }, { once: true });
  }
}

export function preloadCombatAudio(): void {
  for (const name of Object.keys(SOURCES) as SoundId[]) {
    getPool(name);
  }

  installUnlock();
}

export function playShotSound(weapon?: Weapon): void {
  play(weapon?.shotSound ?? 'rifle-shot');
}

export function playHitSound(): void {
  play('hit');
}

export function playMoveSound(sound?: SoundId): void {
  if (sound) {
    play(sound);
  }
}

export function playDeathSound(sound?: SoundId): void {
  if (sound) {
    play(sound);
  }
}

export function playClickSound(): void {
  play('click');
}

function play(name: SoundId): void {
  const source = SOURCES[name];
  const pool = getPool(name);
  const audio = pool.elements[pool.next];

  if (!audio) {
    return;
  }

  pool.next = (pool.next + 1) % pool.elements.length;
  audio.volume = source.volume;
  audio.currentTime = 0;

  const playback = audio.play();

  if (playback) {
    void playback.catch(() => undefined);
  }
}

function installUnlock(): void {
  if (unlockInstalled || typeof window === 'undefined') {
    return;
  }

  unlockInstalled = true;
  const events = ['pointerdown', 'mousedown', 'touchstart', 'keydown'] as const;
  const unlock = () => {
    for (const name of Object.keys(SOURCES) as SoundId[]) {
      prime(name);
    }

    for (const event of events) {
      window.removeEventListener(event, unlock);
    }
  };

  for (const event of events) {
    window.addEventListener(event, unlock);
  }
}
