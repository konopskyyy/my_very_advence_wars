import {
  AuthError,
  fetchMe,
  logoutSession,
  refreshSession,
  type AuthSession,
} from './api';

const STORAGE_KEY = 'mvaw.auth';

type Listener = (session: AuthSession | null) => void;

function readStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readSession(): AuthSession | null {
  const storage = readStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession> | null;

    if (
      !parsed ||
      typeof parsed.token !== 'string' ||
      !parsed.user ||
      typeof parsed.user.id !== 'number' ||
      typeof parsed.user.email !== 'string'
    ) {
      return null;
    }

    return {
      token: parsed.token,
      ...(typeof parsed.refreshToken === 'string' && parsed.refreshToken
        ? { refreshToken: parsed.refreshToken }
        : {}),
      user: {
        id: parsed.user.id,
        email: parsed.user.email,
        createdAt:
          typeof parsed.user.createdAt === 'string' ? parsed.user.createdAt : '',
      },
    };
  } catch {
    return null;
  }
}

class AuthStore {
  private current: AuthSession | null = readSession();
  private readonly listeners = new Set<Listener>();

  get session(): AuthSession | null {
    return this.current;
  }

  get isAuthenticated(): boolean {
    return this.current !== null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current);

    return () => {
      this.listeners.delete(listener);
    };
  }

  set(session: AuthSession): void {
    this.current = session;
    readStorage()?.setItem(STORAGE_KEY, JSON.stringify(session));
    this.notify();
  }

  clear(): void {
    this.current = null;
    readStorage()?.removeItem(STORAGE_KEY);
    this.notify();
  }

  async logout(fetchImpl: typeof fetch = fetch): Promise<void> {
    const refreshToken = this.current?.refreshToken;

    if (refreshToken) {
      try {
        await logoutSession(refreshToken, fetchImpl);
      } catch {
        // Wylogowanie lokalne i tak musi się udać, nawet gdy serwer jest niedostępny.
      }
    }

    this.clear();
  }

  async restore(fetchImpl: typeof fetch = fetch): Promise<AuthSession | null> {
    if (!this.current) {
      return null;
    }

    const current = this.current;

    try {
      const user = await fetchMe(current.token, fetchImpl);
      this.set({ ...current, user });

      return this.current;
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) {
        return this.current;
      }

      if (!current.refreshToken) {
        this.clear();
        return this.current;
      }

      try {
        const session = await refreshSession(current.refreshToken, fetchImpl);
        this.set(session);
      } catch {
        this.clear();
      }

      return this.current;
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}

export const authStore = new AuthStore();
