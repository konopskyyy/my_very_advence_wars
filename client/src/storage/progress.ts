const STORAGE_KEY = 'mvaw:completed-missions';

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function readStorage(): ProgressStorage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function parseCompletedMissions(raw: string | null): readonly string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export function readCompletedMissions(
  storage: ProgressStorage | undefined = readStorage(),
): Set<string> {
  if (!storage) {
    return new Set();
  }

  try {
    return new Set(parseCompletedMissions(storage.getItem(STORAGE_KEY)));
  } catch {
    return new Set();
  }
}

export function markMissionCompleted(
  missionId: string,
  storage: ProgressStorage | undefined = readStorage(),
): void {
  if (!storage) {
    return;
  }

  const completed = readCompletedMissions(storage);

  if (completed.has(missionId)) {
    return;
  }

  completed.add(missionId);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...completed].sort()));
  } catch {
    // Prywatny tryb przeglądarki może odmówić zapisu — gra działa dalej bez trwałego postępu.
  }
}
