import { afterEach, describe, expect, it, vi } from 'vitest';
import { authStore } from '../../src/auth/store';
import type { AuthSession } from '../../src/auth/api';

const SESSION: AuthSession = {
  token: 'token-1',
  user: { id: 7, email: 'gracz@example.com', createdAt: '2026-10-31T12:00:00+00:00' },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asFetch(mock: ReturnType<typeof vi.fn>): typeof fetch {
  return mock as unknown as typeof fetch;
}

afterEach(() => {
  authStore.clear();
});

describe('auth store', () => {
  it('powiadamia subskrybentów o zalogowaniu i wylogowaniu', () => {
    const seen: (AuthSession | null)[] = [];
    const unsubscribe = authStore.subscribe((session) => seen.push(session));

    authStore.set(SESSION);
    authStore.clear();
    unsubscribe();
    authStore.set(SESSION);

    expect(seen).toEqual([null, SESSION, null]);
    expect(authStore.isAuthenticated).toBe(true);
  });

  it('odtwarza sesję przez me i podmienia dane konta', async () => {
    authStore.set(SESSION);
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: 7,
        email: 'nowy@example.com',
        createdAt: '2026-11-01T09:00:00+00:00',
      }),
    );

    const restored = await authStore.restore(asFetch(fetchMock));

    expect(restored?.token).toBe('token-1');
    expect(restored?.user.email).toBe('nowy@example.com');
  });

  it('czyści sesję, gdy me zwraca 401', async () => {
    authStore.set(SESSION);
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'Invalid token.' }, 401));

    const restored = await authStore.restore(asFetch(fetchMock));

    expect(restored).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });

  it('zachowuje sesję przy błędzie sieci', async () => {
    authStore.set(SESSION);
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });

    const restored = await authStore.restore(asFetch(fetchMock));

    expect(restored?.token).toBe('token-1');
    expect(authStore.isAuthenticated).toBe(true);
  });
});
