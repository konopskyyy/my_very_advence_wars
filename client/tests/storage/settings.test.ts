import { describe, expect, it } from 'vitest';
import {
  readSoundEnabled,
  writeSoundEnabled,
  type SettingsStorage,
} from '../../src/storage/settings';

function memoryStorage(initial?: string): SettingsStorage & {
  readonly value: () => string | null;
} {
  let current = initial ?? null;

  return {
    getItem: () => current,
    setItem: (_key, value) => {
      current = value;
    },
    value: () => current,
  };
}

describe('ustawienia dźwięku w pamięci przeglądarki', () => {
  it('domyślnie włącza dźwięk', () => {
    expect(readSoundEnabled(memoryStorage())).toBe(true);
    expect(readSoundEnabled(undefined)).toBe(true);
  });

  it('zapisuje wyciszenie i odczytuje je z powrotem', () => {
    const storage = memoryStorage();

    writeSoundEnabled(false, storage);

    expect(readSoundEnabled(storage)).toBe(false);
    expect(storage.value()).toBe('0');

    writeSoundEnabled(true, storage);

    expect(readSoundEnabled(storage)).toBe(true);
    expect(storage.value()).toBe('1');
  });

  it('działa bez dostępnej pamięci', () => {
    const storage: SettingsStorage = {
      getItem: () => {
        throw new Error('brak dostępu');
      },
      setItem: () => {
        throw new Error('brak dostępu');
      },
    };

    expect(readSoundEnabled(storage)).toBe(true);
    expect(() => writeSoundEnabled(false, storage)).not.toThrow();
  });
});
