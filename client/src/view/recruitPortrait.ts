import type Phaser from 'phaser';
import type { Loadout, PrimaryWeaponId, SecondaryWeaponId } from '../core/loadout';
import type { UnitKind } from '../core/units';
import artilleryUrl from '../assets/ai/units/artillery.jpg?url';
import bazookaUrl from '../assets/ai/units/bazooka.jpg?url';
import bomberUrl from '../assets/ai/units/bomber.jpg?url';
import helicopterUrl from '../assets/ai/units/helicopter.jpg?url';
import infantryUrl from '../assets/ai/units/infantry.png?url';
import scoutUrl from '../assets/ai/units/scout.jpg?url';
import sniperUrl from '../assets/ai/units/sniper.jpg?url';
import tankUrl from '../assets/ai/units/tank.jpg?url';

type PortraitId = UnitKind | 'sniper' | 'bazooka';

const PORTRAIT_URLS: Record<PortraitId, string> = {
  infantry: infantryUrl,
  scout: scoutUrl,
  tank: tankUrl,
  artillery: artilleryUrl,
  bazooka: bazookaUrl,
  bomber: bomberUrl,
  helicopter: helicopterUrl,
  sniper: sniperUrl,
};

const LOADOUT_PORTRAITS: Record<PrimaryWeaponId, Record<SecondaryWeaponId, PortraitId>> = {
  rifle: { pistol: 'infantry', grenades: 'artillery' },
  bazooka: { pistol: 'bazooka', grenades: 'tank' },
  sniper: { pistol: 'sniper', grenades: 'bomber' },
};

function portraitKey(id: PortraitId): string {
  return `recruit-portrait-${id}`;
}

export function preloadRecruitPortraits(scene: Phaser.Scene): void {
  for (const id of Object.keys(PORTRAIT_URLS) as PortraitId[]) {
    if (!scene.textures.exists(portraitKey(id))) {
      scene.load.image(portraitKey(id), PORTRAIT_URLS[id]);
    }
  }
}

export function recruitPortraitKey(kind: UnitKind): string {
  return portraitKey(kind);
}

export function loadoutPortraitKey(loadout: Loadout): string {
  return portraitKey(LOADOUT_PORTRAITS[loadout.primary][loadout.secondary]);
}
