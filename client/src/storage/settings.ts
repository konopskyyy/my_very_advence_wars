const SOUND_KEY = 'mvaw:sound-enabled';

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function readStorage(): SettingsStorage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readSoundEnabled(
  storage: SettingsStorage | undefined = readStorage(),
): boolean {
  if (!storage) {
    return true;
  }

  try {
    return storage.getItem(SOUND_KEY) !== '0';
  } catch {
    return true;
  }
}

export function writeSoundEnabled(
  enabled: boolean,
  storage: SettingsStorage | undefined = readStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // Prywatny tryb przeglądarki może odmówić zapisu — dźwięk działa dalej w tej sesji.
  }
}
