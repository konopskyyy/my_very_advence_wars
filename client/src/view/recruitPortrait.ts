import type Phaser from 'phaser';
import type { UnitKind } from '../core/units';
import artilleryUrl from '../assets/ai/units/artillery.png?url';
import infantryUrl from '../assets/ai/units/infantry.png?url';
import scoutUrl from '../assets/ai/units/scout.png?url';
import tankUrl from '../assets/ai/units/tank.png?url';

const PORTRAIT_URLS: Record<UnitKind, string> = {
  infantry: infantryUrl,
  scout: scoutUrl,
  tank: tankUrl,
  artillery: artilleryUrl,
};

function portraitKey(kind: UnitKind): string {
  return `recruit-portrait-${kind}`;
}

export function preloadRecruitPortraits(scene: Phaser.Scene): void {
  for (const kind of Object.keys(PORTRAIT_URLS) as UnitKind[]) {
    if (!scene.textures.exists(portraitKey(kind))) {
      scene.load.image(portraitKey(kind), PORTRAIT_URLS[kind]);
    }
  }
}

export function recruitPortraitKey(kind: UnitKind): string {
  return portraitKey(kind);
}
