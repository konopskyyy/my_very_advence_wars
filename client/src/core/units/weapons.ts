import type { SoundId } from '../sound';

export type WeaponId = 'rifle' | 'bazooka';

export interface Weapon {
  readonly id: WeaponId;
  readonly label: string;
  readonly shotSound: SoundId;
}

export const RIFLE: Weapon = {
  id: 'rifle',
  label: 'Karabin',
  shotSound: 'rifle-shot',
};

export const BAZOOKA: Weapon = {
  id: 'bazooka',
  label: 'Bazooka',
  shotSound: 'rifle-shot',
};
