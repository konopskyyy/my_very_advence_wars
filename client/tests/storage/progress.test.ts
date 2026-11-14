import { describe, expect, it } from 'vitest';
import {
  markMissionCompleted,
  parseCompletedMissions,
  readCompletedMissions,
  type ProgressStorage,
} from '../../src/storage/progress';

function memoryStorage(initial?: string): ProgressStorage & { readonly value: () => string | null } {
  let current = initial ?? null;

  return {
    getItem: () => current,
    setItem: (_key, value) => {
      current = value;
    },
    value: () => current,
  };
}

describe('postęp misji w pamięci przeglądarki', () => {
  it('odczytuje pusty lub uszkodzony zapis jako brak ukończonych misji', () => {
    expect(parseCompletedMissions(null)).toEqual([]);
    expect(parseCompletedMissions('{')).toEqual([]);
    expect(parseCompletedMissions('{"mission":"x"}')).toEqual([]);
    expect(parseCompletedMissions('["a",1,"b",null]')).toEqual(['a', 'b']);
  });

  it('zapisuje ukończoną misję i odczytuje ją z powrotem', () => {
    const storage = memoryStorage();

    markMissionCompleted('tutorial-pierwsze-kroki', storage);

    expect(readCompletedMissions(storage).has('tutorial-pierwsze-kroki')).toBe(true);
    expect(JSON.parse(storage.value() ?? '[]')).toEqual(['tutorial-pierwsze-kroki']);
  });

  it('nie duplikuje misji i zachowuje wcześniejsze wpisy', () => {
    const storage = memoryStorage(JSON.stringify(['tutorial-pierwsze-kroki']));

    markMissionCompleted('tutorial-pierwsze-kroki', storage);
    markMissionCompleted('tutorial-ruch-jednostek', storage);

    expect(JSON.parse(storage.value() ?? '[]')).toEqual([
      'tutorial-pierwsze-kroki',
      'tutorial-ruch-jednostek',
    ]);
  });

  it('działa bez dostępnej pamięci', () => {
    const storage: ProgressStorage = {
      getItem: () => {
        throw new Error('brak dostępu');
      },
      setItem: () => {
        throw new Error('brak dostępu');
      },
    };

    expect(readCompletedMissions(storage).size).toBe(0);
    expect(() => markMissionCompleted('x', storage)).not.toThrow();
  });
});
