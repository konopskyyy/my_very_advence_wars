import { describe, expect, it, vi } from 'vitest';
import { fetchMe, login, register } from '../../src/auth/api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asFetch(mock: ReturnType<typeof vi.fn>): typeof fetch {
  return mock as unknown as typeof fetch;
}

const SESSION_BODY = {
  token: 'token-1',
  user: { id: 7, email: 'gracz@example.com', createdAt: '2026-10-31T12:00:00+00:00' },
};

describe('auth api', () => {
  it('loguje przez POST i zwraca sesję', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SESSION_BODY));
    const session = await login('gracz@example.com', 'tajne-haslo', asFetch(fetchMock));

    expect(session.token).toBe('token-1');
    expect(session.user.email).toBe('gracz@example.com');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'gracz@example.com',
      password: 'tajne-haslo',
    });
  });

  it('rejestruje przez POST i przyjmuje odpowiedź 201', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SESSION_BODY, 201));
    const session = await register('gracz@example.com', 'tajne-haslo', asFetch(fetchMock));

    expect(session.user.id).toBe(7);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('/api/auth/register');
  });

  it('pobiera konto z tokenem w nagłówku', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: 7, email: 'gracz@example.com', createdAt: '2026-10-31T12:00:00+00:00' }),
    );
    const user = await fetchMe('token-1', asFetch(fetchMock));

    expect(user.email).toBe('gracz@example.com');
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer token-1');
  });

  it('mapuje 401 i 409 na polskie komunikaty', async () => {
    const unauthorized = vi.fn(async () => jsonResponse({ error: 'Invalid email or password.' }, 401));
    const conflict = vi.fn(async () => jsonResponse({ error: 'Email already registered.' }, 409));

    await expect(login('a@b.pl', 'haslo123', asFetch(unauthorized))).rejects.toMatchObject({
      message: 'Nieprawidłowy e-mail lub hasło.',
      status: 401,
    });
    await expect(register('a@b.pl', 'haslo123', asFetch(conflict))).rejects.toMatchObject({
      message: 'Ten e-mail jest już zarejestrowany.',
      status: 409,
    });
  });

  it('mapuje 422 i brak sieci na komunikaty', async () => {
    const invalid = vi.fn(async () => jsonResponse({ violations: [] }, 422));
    const offline = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });

    await expect(register('a@b.pl', 'x', asFetch(invalid))).rejects.toMatchObject({ status: 422 });
    await expect(login('a@b.pl', 'haslo123', asFetch(offline))).rejects.toMatchObject({
      status: 0,
      message: 'Nie można połączyć się z serwerem. Spróbuj ponownie.',
    });
  });
});
