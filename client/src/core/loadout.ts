export type PrimaryWeaponId = 'rifle' | 'bazooka' | 'sniper';
export type SecondaryWeaponId = 'pistol' | 'grenades';

export interface WeaponOption<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly price: number;
  readonly color: number;
}

export interface Loadout {
  readonly primary: PrimaryWeaponId;
  readonly secondary: SecondaryWeaponId;
}

export const PRIMARY_WEAPONS = [
  { id: 'rifle', label: 'Karabin', price: 0, color: 0x6f7d8a },
  { id: 'bazooka', label: 'Bazooka', price: 100, color: 0x8a5a3c },
  { id: 'sniper', label: 'Snajperka', price: 75, color: 0x3f6b4a },
] as const satisfies readonly WeaponOption<PrimaryWeaponId>[];

export const SECONDARY_WEAPONS = [
  { id: 'pistol', label: 'Pistolet', price: 0, color: 0x9aa0a6 },
  { id: 'grenades', label: 'Granaty', price: 30, color: 0x5b6a3a },
] as const satisfies readonly WeaponOption<SecondaryWeaponId>[];

export const DEFAULT_LOADOUT: Loadout = {
  primary: 'rifle',
  secondary: 'pistol',
};

export function primaryWeapon(id: PrimaryWeaponId): WeaponOption<PrimaryWeaponId> {
  return PRIMARY_WEAPONS.find((weapon) => weapon.id === id) ?? PRIMARY_WEAPONS[0];
}

export function secondaryWeapon(id: SecondaryWeaponId): WeaponOption<SecondaryWeaponId> {
  return SECONDARY_WEAPONS.find((weapon) => weapon.id === id) ?? SECONDARY_WEAPONS[0];
}

export function loadoutPrice(loadout: Loadout): number {
  return primaryWeapon(loadout.primary).price + secondaryWeapon(loadout.secondary).price;
}
